"""Static CSS checks using generated practice states; no browser or pixel layout.
Usage: phone-practice-css.py <states.json> <before.html>
Requires tests/css-test-requirements.txt.
"""
from pathlib import Path
import json
import sys
from lxml import html
import cssselect2

# Reuse the established cascade helpers without executing that test suite.
helper=Path(__file__).with_name('mobile-chord-css.py')
scope={'__file__':str(helper)}
exec(compile(helper.read_text().split('sizes =')[0],str(helper),'exec'),scope)
matcher=scope['matcher']
source=(Path(__file__).resolve().parents[1]/'index.html').read_text()
before=Path(sys.argv[2]).read_text()
fixtures=json.loads(Path(sys.argv[1]).read_text())

def dom(fixture,mode):
 root=html.fromstring(source.split('<script>',1)[0]+'</body></html>')
 root.xpath('//body')[0].set('data-fit',str(mode))
 for id in ['note-map','interval-map','chord-map']:
  e=root.get_element_by_id(id)
  if id==fixture['map']:e.attrib.pop('hidden',None)
  else:e.set('hidden','')
 for id,data in fixture['nodes'].items():
  try:e=root.get_element_by_id(id)
  except KeyError:continue
  for key,val in data['attrs'].items():e.set(key,str(val))
  if data.get('className'):e.set('class',data['className'])
  for attr in ['hidden','disabled']:
   if data.get(attr):e.set(attr,'')
   else:e.attrib.pop(attr,None)
  if id.endswith(('feedback-content','answers','keyboard','relations')):
   for child in list(e):e.remove(child)
   e.text=None
   for part in html.fragments_fromstring(data['content'] or ''):
    if isinstance(part,str):e.text=(e.text or '')+part
    else:e.append(part)
  elif id.endswith(('question','step','audio-notice')):e.text=data.get('text','')
 return cssselect2.ElementWrapper.from_html_root(root)

def selected_styles(match,root,targets):
 result={}
 for w in root.iter_subtree():
  if w.etree_element not in targets:continue
  values={}
  for specificity,order,pseudo,declarations in match.match(w):
   if pseudo:continue
   for d in declarations:
    rank=(d.important,specificity,order)
    if d.lower_name not in values or rank>=values[d.lower_name][0]:
     values[d.lower_name]=(rank,scope['tinycss2'].serialize(d.value).strip())
  result[w.etree_element]={k:v[1] for k,v in values.items()}
 return result

cases=0
for width,height in [(319,495),(360,640),(390,844),(972,494),(1366,768)]:
 current_match,prior_match=matcher(source,width,height),matcher(before,width,height)
 for fixture in fixtures:
  for mode in [0,1,2,3]:
   root=dom(fixture,mode);tree=root.etree_element;prefix=fixture['prefix'];play=tree.get_element_by_id(prefix+'play')
   exercise=play.xpath('./div[@class="exercise-body"]')[0];response=exercise.xpath('./div[@class="response-panel"]')[0]
   card=tree.get_element_by_id(prefix+'feedback')
   targets=set(play.iter())
   current=selected_styles(current_match,root,targets);prior=selected_styles(prior_match,root,targets)
   get=lambda name:current[tree.get_element_by_id(prefix+name)]
   if width<=480:
    assert get('play')['display']=='flex',(width,mode,fixture['name'])
    assert current[exercise]['display']=='grid'
    assert current[exercise]['grid-template-columns']=='minmax(0,1fr)'
    assert current[response]['grid-column']=='1'
    assert current[response]['grid-row']=='2'
    assert get('staff')['width']=='100%'
    assert get('staff')['grid-row']=='1'
    assert current[card]['width']=='100%'
    assert current[card]['min-height']=='0'
    assert current[card]['align-self']=='stretch'
    assert current[card]['padding']=='4px 8px'
    assert get('question')['padding-right']=='56px'
    for node in targets:
     classes=node.get('class','').split()
     if 'piano' in classes or 'interval-piano' in classes:assert current[node]['height']=='76px'
     if 'hint-label-short' in classes:assert current[node]['display']=='inline'
     if 'hint-label-full' in classes:assert current[node]['display']=='none'
    if fixture['name']=='interval-start-reading':
     symbol=play.xpath('.//*[@class="reading-symbol"]')[0]
     notes=play.xpath('.//*[@class="reading-notes"]')[0]
     assert current[symbol]['grid-row']=='2';assert current[notes]['grid-row']=='2'
    if fixture['map']=='chord-map' and fixture['nodes']['c-play']['attrs'].get('data-chord-stage')=='symbol':
     choices=tree.get_element_by_id('c-answers').xpath('./div[@class="choices"]')[0]
     assert current[choices]['gap']=='4px'
     assert current[choices]['grid-template-columns']=='repeat(4,minmax(0,1fr))'
     buttons=choices.xpath('./button')
     assert len(buttons)==7
     for button in buttons:
      assert current[button]['min-height']=='36px'
      assert current[button]['padding']=='4px 3px'
      assert current[button]['font-size']=='14px'
      assert prior[button]['min-height']=='44px'
     assert current[exercise]['grid-template-rows']=='minmax(52px,1fr) auto'
    if fixture['name'].startswith('chord-symbol'):
     assert get('reading-actions')['width']=='72px'
     assert get('reading-actions')['max-width']=='72px'
     assert current[card]['grid-template-columns']=='minmax(0,1fr) auto'
     assert get('enter-keys')['min-height']=='44px'
     assert get('enter-keys')['white-space']=='nowrap'
     assert get('enter-keys')['font-size']=='13px'
     full=play.xpath('.//*[@class="enter-label-full"]')[0]
     short=play.xpath('.//*[@class="enter-label-short"]')[0]
     assert current[full]['display']=='none'
     assert current[short]['display']=='inline'
     assert short.text=='找琴键'
   else:
    for node in targets:
     if node.get('class') not in ['hint-label-short','enter-label-short']:assert current[node]==prior[node],(width,node.get('id'),node.get('class'))
     if node.get('class')=='enter-label-short':assert current[node]['display']=='none'
   for node in targets:
    if any(c in node.get('class','').split() for c in ['feedback-message','reading-symbol','reading-notes','reading-detail','reading-label','reading-solfege']):
     for prop in ['font-size','font-family','font-weight','line-height']:
      assert current[node].get(prop)==prior[node].get(prop),(fixture['name'],prop)
   cases+=1
print(f'Static practice CSS passed {cases} map/state/size/mode cases, including 319×495: full-width reading and score, stacked answers/keys, compact spacing, 76px keyboard, hint labels, reading typography and desktop scope. Actual pixels, one-screen fit, touch and sound remain unverified.')
