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
for fixture in fixtures:
 fixture.setdefault('map','chord-map');fixture.setdefault('prefix','c-')

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
for width,height in [(319,495),(390,844),(972,494),(1366,768)]:
 current_match=matcher(source,width,height)
 for fixture in fixtures:
  for mode in [0,1,2,3]:
   root=dom(fixture,mode);tree=root.etree_element;prefix=fixture['prefix'];play=tree.get_element_by_id(prefix+'play')
   exercise=play.xpath('./div[@class="exercise-body"]')[0];response=exercise.xpath('./div[@class="response-panel"]')[0]
   targets=set(play.iter());current=selected_styles(current_match,root,targets)
   get=lambda name:current[tree.get_element_by_id(prefix+name)]
   assert get('play')['display']=='flex'
   assert get('play')['flex-direction']=='column'
   assert current[exercise]['display']=='grid'
   assert current[exercise]['grid-template-columns']=='minmax(0,1fr)'
   assert current[exercise]['grid-template-rows']=='minmax(64px,1fr) auto'
   assert get('staff')['grid-column']=='1' and get('staff')['grid-row']=='1'
   assert get('staff')['max-height']=='none'
   assert current[response]['grid-column']=='1' and current[response]['grid-row']=='2'
   assert get('feedback')['grid-template-columns']=='minmax(0,1fr) auto'
   assert get('feedback')['padding']==('4px 10px' if 'is-prompt' in tree.get_element_by_id(prefix+'feedback').get('class','').split() else '4px 8px'),(width,mode,fixture['name'])
   assert get('reading-actions')['grid-column']=='2'
   assert get('feedback-content')['display']=='flex',(width,mode,fixture['name'],get('feedback-content'))
   for node in targets:
    classes=node.get('class','').split()
    if 'reading-heading' in classes:assert current[node]['display']=='flex'
    if 'reading-symbol' in classes:assert current[node]['font-size']=='25px'
    if 'reading-notes' in classes:assert current[node]['font-size']=='19px'
    if 'reading-label' in classes:assert current[node]['font-size']=='12px'
    if 'piano' in classes or 'interval-piano' in classes:assert current[node]['height']=='64px'
    if 'white' in classes:assert current[node]['min-width']=='44px'
    if 'choices' in classes and len(node.xpath('./button'))==7:
     assert current[node]['grid-template-columns']=='repeat(8,minmax(0,1fr))'
     buttons=node.xpath('./button')
     for i,button in enumerate(buttons):
      assert current[button]['min-height']=='36px'
      assert current[button]['grid-row']==('1' if i<3 else '2')
      if i<3:assert current[button]['grid-column']==f'{2+i*2}/span 2'
      else:assert current[button]['grid-column']=='span 2'
   cases+=1
print(f'A-layout CSS passed {cases} generated-state/size/fit-mode cases: card above score, stacked response, 3+4 equal-width choices, compact typography, 64px piano and retained 44px key widths. Static rules only; browser geometry is verified separately.')
