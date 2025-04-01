import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Console Log Prefixer is now active");

  // Register the command to manually add prefixes
  let disposable = vscode.commands.registerCommand(
    "console-log-prefixer.addPrefixes",
    () => {
      addPrefixesToDocument();
    }
  );
  context.subscriptions.push(disposable);

  // Set up document save listener for automatic prefixing
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (isJavaScriptOrTypeScript(event.document)) {
        event.waitUntil(addPrefixesToDocumentPromise(event.document));
      }
    })
  );
}

function isJavaScriptOrTypeScript(document: vscode.TextDocument): boolean {
  return (
    document.languageId === "javascript" ||
    document.languageId === "typescript" ||
    document.languageId === "javascriptreact" ||
    document.languageId === "typescriptreact"
  );
}

function addPrefixesToDocument() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !isJavaScriptOrTypeScript(editor.document)) {
    vscode.window.showInformationMessage(
      "Open a JavaScript or TypeScript file to add prefixes"
    );
    return;
  }

  const prefixes = addPrefixesToDocumentPromise(editor.document);
  prefixes.then((edits) => {
    if (edits.length > 0) {
      editor.edit((editBuilder) => {
        for (const edit of edits) {
          editBuilder.replace(edit.range, edit.newText);
        }
      });
      vscode.window.showInformationMessage(
        "Console log prefixes added successfully"
      );
    } else {
      vscode.window.showInformationMessage(
        "No console.log statements found to prefix"
      );
    }
  });
}

async function addPrefixesToDocumentPromise(
  document: vscode.TextDocument
): Promise<vscode.TextEdit[]> {
  const edits: vscode.TextEdit[] = [];
  const config = vscode.workspace.getConfiguration("consoleLogPrefixer");

  // Get user settings or use defaults
  const prefix = config.get<string>("prefix", "`[mylog]`");
  const commentPattern = config.get<string>("commentPattern", "// mylog:");

  // Process the document line by line
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);

    // Skip empty lines
    if (line.isEmptyOrWhitespace) {
      continue;
    }

    // Check if the line contains console.log
    if (line.text.includes("console.log(")) {
      // Check if there is a previous line with the comment pattern
      let hasCommentPattern = false;

      if (i > 0) {
        const prevLine = document.lineAt(i - 1);
        if (prevLine.text.trim().startsWith(commentPattern)) {
          hasCommentPattern = true;
        }
      }

      const consoleLogPos = line.text.indexOf("console.log(");
      const leadingSpace = line.text.substring(0, consoleLogPos);

      // Current line has prefix
      if (line.text.includes(`console.log(${prefix}, `)) {
        // If there's no comment pattern but has prefix, remove the prefix
        if (!hasCommentPattern) {
          // Extract the text after the prefix
          const prefixEnd = line.text.indexOf(`, `, consoleLogPos + 12) + 2;
          const textAfterPrefix = line.text.substring(prefixEnd);

          // Create new text without the prefix
          const newText = `${leadingSpace}console.log(${textAfterPrefix}`;

          // Create the edit
          const range = new vscode.Range(
            new vscode.Position(i, 0),
            new vscode.Position(i, line.text.length)
          );

          edits.push(new vscode.TextEdit(range, newText));
        }
      }
      // Current line doesn't have prefix
      else if (hasCommentPattern) {
        // If there's a comment pattern but no prefix, add the prefix
        const textAfterConsoleLog = line.text.substring(consoleLogPos + 12); // 12 is the length of "console.log("

        // Create new text with the prefix
        const newText = `${leadingSpace}console.log(${prefix}, ${textAfterConsoleLog}`;

        // Create the edit
        const range = new vscode.Range(
          new vscode.Position(i, 0),
          new vscode.Position(i, line.text.length)
        );

        edits.push(new vscode.TextEdit(range, newText));
      }
    }
  }

  return edits;
}

export function deactivate() {}
