/**
 * Description: Block Shallow Copy plugin for duplicating blocks and their first-level children.
 *
 * License: MIT
 *
 * @author Mateusz Myalski
 */

function main() {
  logseq.Editor.registerBlockContextMenuItem('Shallow copy', (e) => shallowCopyBlocks(e))
}
async function shallowCopyBlocks(event) {
  try {
    const blockUUID = event.uuid
    const parentBlockEntity = await logseq.Editor.getBlock(blockUUID);

    if (parentBlockEntity.children.length === 0) {
      showNoBlocksMessage();
      return;
    }

    const { parentName, children } = await createBlocksBatch(parentBlockEntity);

    const todayJournalDate = await getTodayJournalDate();
    const journalPageEntity = await createJournalPage(todayJournalDate);

    await insertBlocksIntoPage(journalPageEntity.uuid, { content: parentName, children });

    showCopyToTodayJournalSuccessMessage(parentBlockEntity.children.length, todayJournalDate);
  } catch (error) {
    handleCopyError(error);
  }
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

function handleCopyError(error) {
  console.error('Error copying blocks to journal:', error);
  logseq.UI.showMsg('An error occurred while copying blocks to journal. Check the console for details.');
}

// bootstrap
logseq.ready(main).catch(console.error);
