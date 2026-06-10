export type ThemeKey = "githubDark" | "dracula" | "monokai" | "nord" | "retroAmber";

export const THEMES = {
  githubDark: { name: "GitHub Dark", base: "vs-dark" },
  dracula: { name: "Dracula", base: "vs-dark" },
  monokai: { name: "Monokai", base: "vs-dark" },
  nord: { name: "Nord", base: "vs-dark" },
  retroAmber: { name: "Retro Amber", base: "vs-dark" }
} as const;

export interface MonacoInstance {
  editor: {
    defineTheme: (name: string, themeData: unknown) => void;
  };
  languages: {
    typescript: {
      typescriptDefaults: {
        setDiagnosticsOptions: (options: { noSemanticValidation: boolean; noSyntaxValidation: boolean }) => void;
      };
    };
  };
}

export function registerPlaygroundThemes(monaco: MonacoInstance) {
  // 1. Dracula
  monaco.editor.defineTheme("dracula", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "ff79c6", fontStyle: "bold" },
      { token: "string", foreground: "f1fa8c" },
      { token: "tag", foreground: "8be9fd" },
      { token: "type", foreground: "8be9fd" },
      { token: "comment", foreground: "6272a4" },
      { token: "identifier", foreground: "f8f8f2" },
      { token: "number", foreground: "bd93f9" }
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#343746",
      "editorCursor.foreground": "#f8f8f0"
    }
  });

  // 2. GitHub Dark
  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "ff7b72", fontStyle: "bold" },
      { token: "string", foreground: "a5d6ff" },
      { token: "tag", foreground: "7ee787" },
      { token: "type", foreground: "d2a8ff" },
      { token: "comment", foreground: "8b949e" },
      { token: "identifier", foreground: "c9d1d9" },
      { token: "number", foreground: "79c0ff" }
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editor.lineHighlightBackground": "#161b22",
      "editorCursor.foreground": "#58a6ff"
    }
  });

  // 3. Monokai
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "f92672" },
      { token: "string", foreground: "e6db74" },
      { token: "tag", foreground: "a6e22e" },
      { token: "type", foreground: "66d9ef" },
      { token: "comment", foreground: "75715e" },
      { token: "identifier", foreground: "f8f8f2" },
      { token: "number", foreground: "ae81ff" }
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editorCursor.foreground": "#f8f8f0"
    }
  });

  // 4. Nord
  monaco.editor.defineTheme("nord", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "81a1c1" },
      { token: "string", foreground: "a3be8c" },
      { token: "tag", foreground: "8fbcbb" },
      { token: "type", foreground: "88c0d0" },
      { token: "comment", foreground: "4c566a" },
      { token: "identifier", foreground: "d8dee9" },
      { token: "number", foreground: "b48ead" }
    ],
    colors: {
      "editor.background": "#2e3440",
      "editor.foreground": "#d8dee9",
      "editor.lineHighlightBackground": "#3b4252",
      "editorCursor.foreground": "#d8dee9"
    }
  });

  // 5. Retro Amber
  monaco.editor.defineTheme("retro-amber", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "ffa000", fontStyle: "bold" },
      { token: "string", foreground: "ffd050" },
      { token: "tag", foreground: "ffc000" },
      { token: "type", foreground: "ffb000" },
      { token: "comment", foreground: "7a5500" },
      { token: "identifier", foreground: "ffb000" },
      { token: "number", foreground: "ffb000" }
    ],
    colors: {
      "editor.background": "#0a0700",
      "editor.foreground": "#ffb000",
      "editor.lineHighlightBackground": "#1a1100",
      "editorCursor.foreground": "#ffb000"
    }
  });
}

export function getMonacoThemeName(key: ThemeKey): string {
  if (key === "githubDark") return "github-dark";
  if (key === "retroAmber") return "retro-amber";
  return key;
}
