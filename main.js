const application = require('application');
const fs = require('uxp').storage.localFileSystem;
const { Artboard } = require('scenegraph');
const {alert, confirm, prompt, error, warning} = require("./lib/dialogs.js");

let selectedRatio;

async function exportSelectedArtboards(selection, root) {
    let nodes = selection.items.filter(node => node instanceof Artboard);
    if (nodes.length == 0) {
        error('エラー', 'アートボードを1つ以上選択して実行ください');
        return;
    } else {
        exportArtboards(nodes);
    }
}

async function exportAllArtboards(selection, root) {
    let nodes = root.children.filter(node => node instanceof Artboard);
    if (nodes.length == 0) {
        error('エラー', 'アートボードが存在しません');
        return;
    } else {
        exportArtboards(nodes);
    }
}

async function exportArtboards(nodes) {
    const outputFilePaths = await exportNodes(nodes);
    if (undefined == outputFilePaths) {
        return;
    }
    const joinedFilePath = outputFilePaths.join('\n');
    alert('処理が完了しました', `書き出したPNGファイルは下記に格納されています\n\n${joinedFilePath}`);
}

async function exportNodes(nodes) {
    const dialog = await makeSelectScaleDialog();
    await dialog.showModal();
    dialog.remove();

    if (selectedRatio.selectedIndex < 0) {
        return;
    }

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
            scale: selectedRatio.options[Math.max(0, selectedRatio.selectedIndex)].value
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

function makeSelectScaleDialog() {
    const labelWidth = 75;

    const dialog =
        h("dialog",
          h("form", { method:"dialog", style: { width: 380 }},
            h("h1", "Select the export scale"),
            h("label", { class: "row" },
              h("span", { style: { width: labelWidth } }, "Scale"),
              selectedRatio = h("select", {  },
                                h("option", { selected: true, value: 0.5 }, "0.5x"),
                                h("option", { value: 1 }, "1x"),
                                h("option", { value: 1.5 }, "1.5x"),
                                h("option", { value: 2 }, "2x"),
                                h("option", { value: 3 }, "3x"),
                                h("option", { value: 4 }, "4x"),
                                h("option", { value: 5 }, "5x")
              )
            ),
            h("footer",
              h("button", { uxpVariant: "primary", onclick(e) { selectedRatio.selectedIndex = -1; dialog.close(); } }, "Cancel"),
              h("button", { uxpVariant: "cta", type: "submit", onclick(e){ dialog.close(); e.preventDefault; } }, "OK")
            )
          )
        )
    document.body.appendChild(dialog);
    return dialog;
}

/**
* Shorthand for creating Elements.
* @param {*} tag The tag name of the element.
* @param {*} [props] Optional props.
* @param {*} children Child elements or strings
*/
function h(tag, props, ...children) {
    let element = document.createElement(tag);
    if (props) {
        if (props.nodeType || typeof props !== "object") {
            children.unshift(props);
        }
        else {
            for (let name in props) {
                let value = props[name];
                if (name == "style") {
                    Object.assign(element.style, value);
                }
                else {
                    element.setAttribute(name, value);
                    element[name] = value;
                }
            }
        }
    }
    for (let child of children) {
        element.appendChild(typeof child === "object" ? child : document.createTextNode(child));
    }
    return element;
}

module.exports = {
    commands: {
        exportSelectedArtboards,
        exportAllArtboards
    }
};
