/**
 * Description: Block Shallow Copy plugin for duplicating blocks and their first-level children.
 *
 * License: MIT
 *
 * @author Mateusz Myalski
 */

function main() {
  logseq.Editor.registerBlockContextMenuItem('Shallow copy',
    async (e) => {
      const blockUUID = e.uuid
      const parentBlockEntity = await logseq.Editor.getBlock(blockUUID)

      if (parentBlockEntity.children.length == 0) {
        logseq.App.showMsg('No blocks to copy!')
        return
      }
      
      const parentName = parentBlockEntity.content
      let blocksBatch = {
        content: parentName,
        children: []
      }

      parentBlockEntity.children.forEach(async element => {
        const elementBlockEntity = await logseq.Editor.getBlock(element[1])
        blocksBatch.children.push({ content: elementBlockEntity.content })
      });

      const userInfo = await logseq.App.getUserConfigs()

      // BUG workaround: Used "do" in date format means day of year not day of month
      const preferredDateFormat = userInfo["preferredDateFormat"].replace("do", "Do")
      const todayJournalDate = moment().format(preferredDateFormat)
      const journalPageEntity = await logseq.Editor.createPage(todayJournalDate, { journal: true })

      logseq.Editor.insertBatchBlock(journalPageEntity.uuid, blocksBatch)
      logseq.App.showMsg('Copied [' + parentBlockEntity.children.length + '] blocks to ' + todayJournalDate + '!')
    })

}

// bootstrap
logseq.ready(main).catch(console.error)

