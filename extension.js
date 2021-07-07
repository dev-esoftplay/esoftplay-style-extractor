// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require("fs")
const shorthash = require("shorthash")
const shell = require('child_process').execSync;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let extract = vscode.commands.registerCommand('esoftplay-style-extractor.extractStyle', function () {
		const editor = vscode.window.activeTextEditor;
		const fullName = editor.document.fileName.split("/")
		const fullpath = fullName.join("/")
		let styleExported = []
		let names = []
		let fileString = fs.readFileSync(fullpath).toString()
		let pattern = /applyStyle\(((?:\[|\{).*(?:\]|\}))\)/g
		let arrStyle = fileString.match(pattern)
		if (arrStyle && arrStyle.length > 0) {
			for (let i = 0; i < arrStyle.length; i++) {
				let style = arrStyle[i];
				const name = shorthash.unique(style)
				fileString = fileString.replace(style, "styleId_" + name)
				style = style.replace("applyStyle(", "")
				style = style.substring(0, style.length - 1)
				if (!names.includes(name) && !fileString.includes('const styleId_' + name))
					styleExported.push('const styleId_' + name + ': any = ' + style)
				names.push(name)
			}
			let text = '\n' + styleExported.join("\n")
			fs.writeFileSync(fullpath, fileString + text)
			vscode.window.showInformationMessage('Style berhasil di Extract');
		} else {
			vscode.window.showWarningMessage("applyStyle not detected")
		}
	});
	let retract = vscode.commands.registerCommand('esoftplay-style-extractor.retractStyle', function () {
		const editor = vscode.window.activeTextEditor;
		const fullName = editor.document.fileName.split("/")
		const fullpath = fullName.join("/")
		let arnames = []
		let names = []
		let fileString = fs.readFileSync(fullpath).toString()
		let pattern = /const\s(styleId_.*?)\:\s{0,}any\s{0,}=(.*)/g
		let arrStyle = fileString.match(pattern)
		if (arrStyle && arrStyle.length > 0) {
			for (let i = 0; i < arrStyle.length; i++) {
				let style = arrStyle[i];
				const name = (/const\s(styleId_.*?)\:/g).exec(style)[1]
				const instyle = (/const\sstyleId_.*?\:\s{0,}any\s{0,}=\s(.*)/g).exec(style)[1]
				// let x = style
				// x = x.replace(/\[/g, "\\[")
				// x = x.replace(/\]/g, "\\]")
				arnames.push({ name, instyle })
				names.push(name)
			}
			arnames.forEach((x) => {
				fileString = fileString.replace(new RegExp(x.name, "g"), "applyStyle(" + x.instyle + ")")
			})
			fileString = fileString.replace(/const\sapplyStyle.*\n?/g, "")
			fs.writeFileSync(fullpath, fileString.substring(0, fileString.length - 1))
			vscode.window.showInformationMessage('Style berhasil di Revert');
		} else {
			vscode.window.showWarningMessage("styleId not detected")
		}
	});

	context.subscriptions.push(extract);
	context.subscriptions.push(retract);
}
exports.activate = activate;

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
