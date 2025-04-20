// extension.js
const vscode = require('vscode');

function activate(context) {
  const provider = vscode.languages.registerCompletionItemProvider(
    'termemp',
    {
      provideCompletionItems(document, position) {
        const line = document.lineAt(position);
        const prefix = line.text.substring(0, position.character);
        if (!prefix.endsWith('.')) {
          return;
        }

        // 1. extract variable name (with the leading $) before the dot
        const varWithDollar = prefix.slice(0, -1).trim();  // e.g. "$myWindow"
        // strip the leading '$' for regex convenience
        const varName = varWithDollar.startsWith('$')
          ? varWithDollar.slice(1)
          : varWithDollar;

        // 2. scan all lines *above* the cursor for an assignment like:
        //    $myWindow = window(...
        let detectedType = null;
        const assignRegex = new RegExp(`^\\s*\\$${varName}\\s*=\\s*(\\w+)\\(`);
        for (let i = 0; i < position.line; i++) {
          const textLine = document.lineAt(i).text;
          const m = textLine.match(assignRegex);
          if (m) {
            detectedType = m[1];  // e.g. "window"
            break;
          }
        }

        // 3. define property lists by type
        const propsByType = {
          window: ['open', 'close', 'show', 'hide', 'resize', 'move', 'setTitle'],
          button: ['click', 'enable', 'disable', 'setText', 'isEnabled'],
          text:   ['setText', 'clear', 'append', 'length']
          // add more as you need…
        };

        // 4. choose the right list (default if we didn’t detect a type)
        const suggestions = (detectedType && propsByType[detectedType])
          ? propsByType[detectedType]
          : ['length', 'toUpperCase', 'toLowerCase', 'substring', 'trim'];

        // 5. return CompletionItems
        return suggestions.map(prop =>
          new vscode.CompletionItem(prop, vscode.CompletionItemKind.Property)
        );
      }
    },
    '.' // trigger on dot
  );

  context.subscriptions.push(provider);
}

function deactivate() {}

module.exports = { activate, deactivate };
