const application = require('application');
const fs = require('uxp').storage.localFileSystem;
const { Artboard } = require('scenegraph');
const {alert, confirm, prompt, error, warning} = require("./lib/dialogs.js");

// 書き出し時の比率
const ratioItems = [
    {"name": "0.5x", "value": "0.5"},
    {"name": "1x", "value": "1"},
    {"name": "1.5x", "value": "1.5"},
    {"name": "2x", "value": "2"},
    {"name": "3x", "value": "3"},
    {"name": "4x", "value": "4"}
];

async function exportSelectedArtboards(selection, root) {
    let nodes = selection.items.filter(node => node instanceof Artboard);
    if (nodes.length == 0) {
        error('エラー', 'アートボードを1つ以上選択して実行ください');
        return;
    }
    const outputFilePaths = await exportArtboards(nodes);
    if (undefined == outputFilePaths) {
        return;
    }
    const joinedFilePath = outputFilePaths.join('\n');
    alert('処理が完了しました', `書き出したPNGファイルは下記に格納されています\n\n${joinedFilePath}`);
}

async function exportAllArtboards(selection, root) {
    let nodes = root.children.filter(node => node instanceof Artboard);
    if (nodes.length == 0) {
        error('エラー', 'アートボードが存在しません');
        return;
    }
    const outputFilePaths = await exportArtboards(nodes);
    if (undefined == outputFilePaths) {
        return;
    }
    const joinedFilePath = outputFilePaths.join('\n');
    alert('処理が完了しました', `書き出したPNGファイルは下記に格納されています\n\n${joinedFilePath}`);
}

async function exportArtboards(nodes) {
    const excutedTimeStr = getNowYMDHMS();
    const selectedFolder = await fs.getFolder();
    if (null == selectedFolder) {
        return undefined;
    }
    const folder = await selectedFolder.createFolder(excutedTimeStr);

    let renditions = await makeRenditionOptions(nodes, folder);
    application.createRenditions(renditions)
        .then(results => {
    })
    .catch(error => {
        console.log(error);
    })

    // 書き出したファイルのパスを配列に格納
    const outputFilePaths = renditions.map(rendition => {
        return rendition.outputFile.nativePath;
    });

    return outputFilePaths;
}

async function makeRenditionOptions(nodes, folder) {
    let renditions = [];
    await Promise.all(nodes.map(async (node, i) => {
        const file = await folder.createFile(node.name + '.png', {overwrite: true});
        renditions.push({
            node: node,
            outputFile: file,
            type: 'png',
            scale: 2
        });
    }));
    return renditions;
}

function getNowYMDHMS() {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = ('00' + (dt.getMonth()+1)).slice(-2);
    const d = ('00' + dt.getDate()).slice(-2);
    const h = ('00' + dt.getHours()).slice(-2);
    const mm = ('00' + dt.getMinutes()).slice(-2);
    const s = ('00' + dt.getSeconds()).slice(-2);
    const result = y + m + d + h + mm + s;
    return result;
}

module.exports = {
    commands: {
        exportSelectedArtboards,
        exportAllArtboards
    }
};
