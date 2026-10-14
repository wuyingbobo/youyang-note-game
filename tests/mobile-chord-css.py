"""Static CSS cascade checks, not browser rendering.
Requires: pip install -r tests/css-test-requirements.txt
First generate fixtures with node tests/chord-layout-states.cjs <fixture.json>.
Pass fixture.json and the pre-change index.html as arguments.
"""
import json
import re
import sys
from pathlib import Path
import tinycss2
import cssselect2
from lxml import html

source = (Path(__file__).resolve().parents[1] / 'index.html').read_text()
before = Path(sys.argv[2]).read_text()
fixtures = json.loads(Path(sys.argv[1]).read_text())

def media_matches(query, width, height):
    for alternative in query.split(','):
        conditions = re.findall(r'\((min|max)-(width|height):\s*(\d+)px\)', alternative)
        if conditions and all((width if axis == 'width' else height) <= int(n) if bound == 'max' else (width if axis == 'width' else height) >= int(n) for bound, axis, n in conditions):
            return True
    return False

def matcher(text, width, height):
    match = cssselect2.Matcher()
    css = text.split('<style>', 1)[1].split('</style>', 1)[0]
    def walk(rules):
        for rule in rules:
            if rule.type == 'at-rule' and rule.lower_at_keyword == 'media':
                if media_matches(tinycss2.serialize(rule.prelude), width, height):
                    walk(tinycss2.parse_rule_list(rule.content, skip_whitespace=True, skip_comments=True))
            elif rule.type == 'qualified-rule':
                declarations = [d for d in tinycss2.parse_declaration_list(rule.content, skip_whitespace=True, skip_comments=True) if d.type == 'declaration']
                for selector in cssselect2.compile_selector_list(tinycss2.serialize(rule.prelude)):
                    match.add_selector(selector, declarations)
    walk(tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=True))
    return match

def fixture_dom(fixture, mode):
    root = html.fromstring(source.split('<script>', 1)[0] + '</body></html>')
    root.xpath('//body')[0].set('data-fit', str(mode))
    for key in ['note-map', 'interval-map']:
        root.get_element_by_id(key).set('hidden', '')
    root.get_element_by_id('chord-map').attrib.pop('hidden', None)
    for key, data in fixture['nodes'].items():
        node = root.get_element_by_id(key)
        for name, value in data['attrs'].items():
            node.set(name, str(value))
        if data.get('className'):
            node.set('class', data['className'])
        for prop in ['hidden', 'disabled']:
            if data.get(prop):
                node.set(prop, '')
            else:
                node.attrib.pop(prop, None)
        if key in ['c-feedback-content', 'c-relations', 'c-answers', 'c-keyboard']:
            for child in list(node):
                node.remove(child)
            node.text = None
            for fragment in html.fragments_fromstring(data['content'] or ''):
                if isinstance(fragment, str):
                    node.text = (node.text or '') + fragment
                else:
                    node.append(fragment)
        elif key in ['c-question', 'c-step', 'c-audio-notice']:
            node.text = data.get('text', '')
    return cssselect2.ElementWrapper.from_html_root(root)

def styles(match, root):
    result = {}
    for wrapper in root.iter_subtree():
        values = {}
        for specificity, order, pseudo, declarations in match.match(wrapper):
            if pseudo:
                continue
            for declaration in declarations:
                priority = (declaration.important, specificity, order)
                if declaration.lower_name not in values or priority >= values[declaration.lower_name][0]:
                    values[declaration.lower_name] = (priority, tinycss2.serialize(declaration.value).strip())
        result[wrapper.etree_element] = {key: value[1] for key, value in values.items()}
    return result

sizes = [(320,568),(360,640),(390,844),(412,915),(480,640),(619,494),(640,700),(390,480)]
cases = 0
for width, height in sizes:
    current_matcher, prior_matcher = matcher(source, width, height), matcher(before, width, height)
    for fixture in fixtures:
        for mode in [0,1,2,3]:
            root = fixture_dom(fixture, mode)
            current, prior = styles(current_matcher, root), styles(prior_matcher, root)
            nodes = root.etree_element
            get = lambda key: current[nodes.get_element_by_id(key)]
            play = nodes.get_element_by_id('c-play')
            exercise = play.xpath('./div[@class="exercise-body"]')[0]
            response = exercise.xpath('./div[@class="response-panel"]')[0]
            assert get('c-play')['display'] == 'flex', (width, mode, fixture['name'])
            assert current[exercise]['display'] == 'grid'
            assert current[response]['display'] == 'grid', (width,height,mode,fixture['name'],current[response])
            side = width > 480
            assert current[response]['grid-column'] == ('2' if side else '1')
            assert current[response]['grid-row'] == ('1' if side else '2')
            assert get('c-keyboard')['grid-row'] == '1'
            assert get('c-relations')['grid-row'] == '2'
            assert get('c-audio-notice')['grid-row'] == '3'
            assert get('c-staff')['width'] == '100%'
            assert get('c-reading-actions')['grid-column'] == '2'
            assert get('c-reading-actions')['grid-row'] == '1'
            assert get('c-reading-actions')['width'] == '88px'
            assert get('c-answers')['display'] == 'none'
            piano = nodes.get_element_by_id('c-keyboard').xpath('./div/div')[0]
            assert current[piano]['height'] == ('76px' if width <= 480 else 'clamp(88px,14dvh,104px)')
            assert current[piano]['min-width'] == 'var(--keyboard-width)'
            scroller = piano.getparent()
            assert current[scroller]['overflow-x'] == 'auto'
            assert current[scroller]['overflow-y'] == 'hidden'
            details = nodes.get_element_by_id('c-relations').xpath('./details')[0]
            details.set('open', '')
            opened = styles(current_matcher, root)
            columns = details.xpath('./div[@class="relation-columns"]')[0]
            close = columns.xpath('./button')[0]
            assert opened[columns]['position'] == 'fixed'
            assert opened[close]['display'] == 'block'
            # Reading typography and both other modules keep their original rules.
            for node in nodes.iter():
                classes = node.get('class', '').split()
                if any(c in classes for c in ['feedback-message','reading-label','reading-symbol','reading-notes','reading-detail']):
                    assert current[node].get('font-size') == prior[node].get('font-size')
                if width > 480 and any(ancestor.get('id') in ['note-map','interval-map'] for ancestor in node.iterancestors()):
                    if node.get('class') == 'hint-label-short':
                        assert current[node]['display'] == 'none'
                    else:
                        assert current[node] == prior[node], node.get('id')
            cases += 1

# Desktop and the first chord step must retain all existing declarations.
for width, height in [(619,494),(972,494),(1366,768)]:
    root = fixture_dom(fixtures[0], 0)
    if width <= 640:
        root.etree_element.get_element_by_id('c-play').set('data-chord-stage', 'symbol')
    current = styles(matcher(source,width,height), root)
    prior = styles(matcher(before,width,height), root)
    for node in root.etree_element.iter():
        if node.get('class') not in ['relation-identity','hint-label-short']:
            assert current[node] == prior[node], (width, node.get('id'), node.get('class'))
print(f'Static CSS cascade passed {cases} generated-state/size/mode cases; keyboard rows, full widths, scroll declarations, close controls, reading fonts, desktop and first-step scope checked; phone maps intentionally share the compact practice layout. Pixel geometry, touch and audible output remain unverified.')
