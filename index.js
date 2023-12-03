/**
 * Description: Block Shallow Copy plugin for duplicating blocks and their first-level children.
 *
 * License: MIT
 *
 * @author Mateusz Myalski
 */

const pluginSettings = [{
  key: "copyToClipboard",
  default: false,
  description: "Copy the block's children into the clipboard instead current journal page.",
  title: "Copy block's children into the clipboard",
  type: "boolean",
}];

function main() {
  logseq.Editor.registerBlockContextMenuItem('Shallow copy', (e) => shallowCopyBlocks(e))
}

async function shallowCopyBlocks(event) {
  try {
    const blockUUID = event.uuid;
    const parentBlockEntity = await logseq.Editor.getBlock(blockUUID);

    if (parentBlockEntity.children.length === 0) {
      showNoBlocksMessage();
      return;
    }

    if (logseq.settings.copyToClipboard) {
      await copyToClipboard(parentBlockEntity);
    } else {
      await copyToJournalPage(parentBlockEntity);
    }

  } catch (error) {
    handleCopyError(error);
  }
}

async function copyToClipboard(blockToCopyEntity) {
  const { stringifiedBlocks, numberOfBlocks } = await createBlocksString(blockToCopyEntity);

  window.focus()
  await navigator.clipboard.writeText(stringifiedBlocks);

  showCopyToClipboardSuccessMessage(numberOfBlocks);
}

async function copyToJournalPage(blockToCopyEntity) {
  const { parentName, children } = await createBlocksBatch(blockToCopyEntity);

  const todayJournalDate = await getTodayJournalDate();
  const journalPageEntity = await createJournalPage(todayJournalDate);

  await insertBlocksIntoPage(journalPageEntity.uuid, { content: parentName, children });

  showCopyToTodayJournalSuccessMessage(blockToCopyEntity.children.length, todayJournalDate);

}

async function createBlocksString(parentBlockEntity) {
  let stringifiedBlocks = "";
  let numberOfBlocks = 0;

  const parentName = parentBlockEntity.content;
  stringifiedBlocks += `- ${parentName}\n`;

  const children = await Promise.all(parentBlockEntity.children.map(async (element) => {
    const elementBlockEntity = await logseq.Editor.getBlock(element[1]);
    numberOfBlocks += 1;
    return elementBlockEntity.content;
  }));

  children.forEach((el) => { stringifiedBlocks += `\t- ${el}\n`; });

  return { stringifiedBlocks, numberOfBlocks };
}

async function createBlocksBatch(parentBlockEntity) {
  const parentName = parentBlockEntity.content;
  const children = await Promise.all(parentBlockEntity.children.map(async (element) => {
    const elementBlockEntity = await logseq.Editor.getBlock(element[1]);
    return { content: elementBlockEntity.content };
  }));

  return { parentName, children };
}

async function getTodayJournalDate() {
  const userInfo = await logseq.App.getUserConfigs();
  const preferredDateFormat = userInfo["preferredDateFormat"].replace("do", "Do");
  return moment().format(preferredDateFormat);
}

async function createJournalPage(date) {
  return await logseq.Editor.createPage(date, { journal: true });
}

async function insertBlocksIntoPage(journalPageUUID, blocksBatch) {
  await logseq.Editor.insertBatchBlock(journalPageUUID, blocksBatch);
}

function showNoBlocksMessage() {
  logseq.UI.showMsg('No blocks to copy!');
}

function showCopyToTodayJournalSuccessMessage(blocksCount, todayJournalDate) {
  logseq.UI.showMsg(`Copied [${blocksCount}] blocks to ${todayJournalDate}!`);
}

function showCopyToClipboardSuccessMessage(blocksCount) {
  logseq.UI.showMsg(`Copied [${blocksCount}] blocks to the clipboard!`);
}

function handleCopyError(error) {
  console.error('Error copying blocks to journal:', error);
  logseq.UI.showMsg('An error occurred while copying blocks to journal. Check the console for details.');
}

// bootstrap
logseq.useSettingsSchema(pluginSettings).ready(main).catch(console.error);
