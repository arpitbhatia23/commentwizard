const vscode = require("vscode");
const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { generateText } = require("ai");
async function generateComment() {
  console.log("🔧 CommentWizard command triggered!");
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found!");
    return;
  }

  const selection = editor.selection;
  const selectedCode = editor.document.getText(selection);
  const language = editor.document.languageId;
  if (!selectedCode) {
    vscode.window.showWarningMessage(
      "Please select some code to generate a comment."
    );
    return;
  }

  // Get API key from settings (or fallback to env variable)
  const apiKey =
    vscode.workspace.getConfiguration("commentwizard").get("geminiApiKey") ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    vscode.window.showErrorMessage(
      "Please set your Gemini API key in the settings "
    );
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating comment ...",

        cancellable: false,
      },
      async (progress) => {
        // progress.report({ message: "..." });

        const ai = createGoogleGenerativeAI({ apiKey });
        const result = await generateText({
          model: ai("models/gemini-2.0-flash"),
          prompt: `For the following ${language} code, generate a  beginner-friendly code comment describing the purpose of the code.
Use the correct comment style for the language (e.g., //, #, /* */, """ """).
Only output the comment, and nothing else—no explanations or extra text.
Here is the code:
${selectedCode}

Examples:

// Single-line comment (JavaScript)
function add(a, b) {
  return a + b;
}
// Returns the sum of two numbers

# Single-line comment (Python)
def greet(name):
    print(f"Hello, {name}!")
# Prints a greeting message

/* Multi-line comment (JavaScript) */
function processData(data) {
  // ...process...
  return result;
}
/*
Processes the input data and returns the result.
*/

""" Multi-line comment (Python) """
def calculate_area(radius):
    return 3.14 * radius * radius
"""
Calculates the area of a circle given its radius.
"""

`,
        });

        let comment = result.text.trim();

        editor.edit((editBuilder) => {
          editBuilder.insert(selection.start, `${comment}\n`);
        });
        vscode.window.showInformationMessage("Comment added successfully!");
      }
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error generating comment: ${error.message}`
    );
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("CommentWizard is now active!");

  let disposable = vscode.commands.registerCommand(
    "commentwizard.generateComment",
    generateComment
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
