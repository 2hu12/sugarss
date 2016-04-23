import parse from '../parse';

import { jsonify } from 'postcss-parser-tests';
import   path      from 'path';
import   test      from 'ava';
import   fs        from 'fs';

test('detects indent', t => {
    let root = parse('@one\n  @two\n    @three');
    t.deepEqual(root.raws.indent, '  ');
});

test('throws on first indent', t => {
    t.throws(() => {
        parse('  @charset "UTF-8"');
    }, '<css input>:1:1: First line should not have indent');
});

test('throws on too big indent', t => {
    t.throws(() => {
        parse('@supports\n  @media\n      // test');
    }, '<css input>:3:1: Expected 4 indent, but get 6');
});

test('throws on wrong indent step', t => {
    t.throws(() => {
        parse('@supports\n  @media\n @media');
    }, '<css input>:3:1: Expected 0 or 2 indent, but get 1');
});

test('throws on decl without property', t => {
    t.throws(() => {
        parse(': black');
    }, '<css input>:1:1: Declaration without name');
});

test('throws on space between property', t => {
    t.throws(() => {
        parse('one two: black');
    }, '<css input>:1:5: Unexpected separator in property');
});

test('keeps trailing spaces', t => {
    let root = parse('@media  s \n  a\n  b \n    a : \n      b \n//  a \n \n');
    t.deepEqual(root.raws.after, '\n \n');
    t.deepEqual(root.first.raws.sssBetween, ' ');
    t.deepEqual(root.first.raws.afterName, '  ');
    t.deepEqual(root.first.first.raws.sssBetween, ' ');
    t.deepEqual(root.first.first.first.raws.between, ' : \n      ');
    t.deepEqual(root.first.first.first.raws.value.raw, 'b ');
    t.deepEqual(root.last.raws.left, '  ');
    t.deepEqual(root.last.raws.inlineRight, ' ');
});

test('supports files without last new line', t => {
    t.deepEqual(parse('color: black').raws.after, '');
});

test('keeps last new line', t => {
    t.deepEqual(parse('color: black\n').raws.after, '\n');
});

let tests = fs.readdirSync(path.join(__dirname, 'cases'))
              .filter(i => path.extname(i) === '.sss' );

function read(file) {
    return fs.readFileSync(path.join(__dirname, 'cases', file)).toString();
}

for ( let name of tests ) {
    test('parses ' + name, t => {
        let sss    = read(name);
        let css    = read(name.replace(/\.sss/, '.css'));
        let json   = read(name.replace(/\.sss/, '.json'));
        let root   = parse(sss, { from: name });
        let result = root.toResult({
            map: {
                inline:     false,
                annotation: false
            }
        });
        t.deepEqual(result.css, css);
        t.deepEqual(jsonify(root), json.trim());
    });
}
