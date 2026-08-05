import { prisma } from './lib/prisma';
import { writeFileSync } from 'fs';

async function checkMerchandise() {
  const result = await prisma.$queryRaw`
    SELECT id, name, term_condition as description 
    FROM merchandise 
    WHERE id = 81
  ` as any[];
  
  console.log('Merchandise ID 81:');
  console.log('Name:', result[0].name);
  console.log('HTML length:', result[0].description.length);
  
  // Write HTML to file for inspection
  writeFileSync('merchandise_81_html_after_fix.html', result[0].description);
  console.log('HTML written to merchandise_81_html_after_fix.html');
  
  // Check for garbage attributes
  const html = result[0].description;
  const hasObjectString = html.includes('[object Object]');
  const hasPathAttr = html.includes(' path='); // space before to avoid matching data-slate-id paths
  const hasApiAttr = html.includes(' api='); // space before to avoid matching legitimate attributes
  const hasEditorAttr = html.includes(' editor='); // space before to avoid matching data-slate-editor
  const hasPluginAttr = html.includes(' plugin=');
  const hasTfAttr = html.includes(' tf=');
  const hasElementAttr = html.includes(' element='); // space before to avoid matching data-slate-element
  const hasAttributesAttr = html.includes(' attributes=');
  
  console.log('\nGarbage attribute check:');
  console.log('[object Object]:', hasObjectString ? '❌ FOUND' : '✅ CLEAN');
  console.log('path attribute:', hasPathAttr ? '❌ FOUND' : '✅ CLEAN');
  console.log('api attribute:', hasApiAttr ? '❌ FOUND' : '✅ CLEAN');
  console.log('editor attribute:', hasEditorAttr ? '❌ FOUND' : '✅ CLEAN');
  console.log('plugin attribute:', hasPluginAttr ? '❌ FOUND' : '✅ CLEAN');
  console.log('tf attribute:', hasTfAttr ? '❌ FOUND' : '✅ CLEAN');
  console.log('element attribute:', hasElementAttr ? '❌ FOUND' : '✅ CLEAN');
  console.log('attributes attribute:', hasAttributesAttr ? '❌ FOUND' : '✅ CLEAN');
  
  if (hasObjectString || hasPathAttr || hasApiAttr || hasEditorAttr || hasPluginAttr || hasTfAttr || hasElementAttr || hasAttributesAttr) {
    console.log('\n❌ HTML still contains garbage attributes');
  } else {
    console.log('\n✅ HTML is clean - no garbage attributes found');
  }
}

checkMerchandise()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
