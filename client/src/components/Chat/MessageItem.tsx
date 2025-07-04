import React from "react";
import type { Message, UserProfile } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Common/Avatar";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Bot, User, Edit3, Copy, Trash2, RefreshCw, GitFork, Save, XCircle, Settings, CheckCircle, AlertCircle } from "lucide-react";
import classNames from "classnames";
import type { MarkedOptions } from 'marked';
import { Textarea } from "@/components/Common/Textarea";
import { Button } from "@/components/Common/Button";

const customMarkedRenderer = new marked.Renderer();
customMarkedRenderer.code = (code: string, language: string | undefined, isEscaped: boolean): string => {
  const lang = language || 'plaintext';
  const escapedCodeForAttribute = code.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let highlightedCode;
  if (hljs.getLanguage(lang)) {
    highlightedCode = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } else {
    highlightedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, ">&gt;");
  }
  const langClass = `language-${lang}`;
  const copyButtonText = "Copy";
  return `
    <div class="code-block-wrapper group relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
      <button
        type="button"
        class="copy-code-button absolute top-2 right-2 z-10 p-1.5 text-xs bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150 ease-in-out"
        data-clipboard-text="${escapedCodeForAttribute}"
        title="Copy code"
      >
        ${copyButtonText}
      </button>
      <pre class="!bg-transparent !p-0"><code class="${langClass} hljs !p-4 !pt-8 block">${highlightedCode}</code></pre>
    </div>
  `;
};

const customMarkedOptions: MarkedOptions = {
  renderer: customMarkedRenderer,
  pedantic: false,
  gfm: true,
  breaks: true,
};

interface MessageItemProps {
  message: Message;
  onResend?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onBranch?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onResend,
  onEditMessage,
  onDelete,
  onCopy,
  onBranch,
}) => {
  const { id: messageId, role, content, createdAt, user, isLoading, error } = message;
  const messageRootRef = React.useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const getTextContent = (content: Message['content']): string => {
    if (!content) return "";
    if (Array.isArray(content)) {
      return content.filter(p => p.type === 'text').map(p => p.text).join('\n');
    }
    return content;
  };

  const [editText, setEditText] = React.useState(getTextContent(content));

  React.useEffect(() => {
    if (!isEditing) {
      setEditText(getTextContent(content));
    }
  }, [content, isEditing]);

  const handleEditClick = () => {
    setEditText(getTextContent(content));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEditMessage && editText.trim() !== getTextContent(content).trim()) {
      onEditMessage(messageId, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(getTextContent(content));
  };

  React.useEffect(() => {
    const handleCopyClick = async (event: Event) => {
      const targetNode = event.target;
      if (!(targetNode instanceof Element)) return;
      const button = targetNode.closest('.copy-code-button') as HTMLButtonElement | null;
      if (button) {
        const textToCopy = button.getAttribute('data-clipboard-text');
        if (textToCopy) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            button.textContent = 'Copied!';
            setTimeout(() => { if (button.textContent === 'Copied!') button.textContent = 'Copy'; }, 2000);
          } catch (err) {
            console.error('Failed to copy code:', err);
            button.textContent = 'Error!';
            setTimeout(() => { if (button.textContent === 'Error!') button.textContent = 'Copy'; }, 2000);
          }
        }
      }
    };

    const currentMessageRoot = messageRootRef.current;
    if (currentMessageRoot) {
      currentMessageRoot.addEventListener('click', handleCopyClick);
    }
    return () => {
      if (currentMessageRoot) {
        currentMessageRoot.removeEventListener('click', handleCopyClick);
      }
    };
  }, [content, messageId]);

  const DOMPURIFY_CONFIG_FOR_KATEX = {
    ADD_TAGS: ["math", "mtable", "mtd", "mtr", "mrow", "mi", "mn", "mo", "ms", "mspace", "mtext", "mfrac", "msqrt", "mroot", "mstyle", "merror", "mpadded", "mphantom", "mfenced", "menclose", "semantics", "annotation", "svg", "path", "g", "line", "rect", "circle", "use", "defs", "symbol", "foreignobject"],
    ADD_ATTR: ['xmlns', 'xlink:href', 'aria-hidden', 'style', 'width', 'height', 'viewbox', 'preserveaspectratio', 'transform', 'd', 'stroke', 'fill', 'stroke-width', 'encoding', 'definitionurl', 'accent', 'accentunder', 'align', 'alignmentscope', 'charalign', 'charspacing', 'class', 'close', 'columnalign', 'columnlines', 'columnspacing', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'edge', 'fence', 'fontfamily', 'fontsize', 'fontstyle', 'fontweight', 'form', 'frame', 'href', 'id', 'indentalign', 'indentalignfirst', 'indentalignlast', 'indentshift', 'indentshiftfirst', 'indentshiftlast', 'indenttarget', 'infixlinebreakstyle', 'largeop', 'length', 'linebreak', 'linebreakmultchar', 'linebreakstyle', 'lineleading', 'linethickness', 'location', 'longdivstyle', 'lquote', 'lspace', 'macros', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minlabelspacing', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'overflow', 'position', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rquote', 'rspace', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'shift', 'side', 'stackalign', 'stretchy', 'symmetric', 'variant', 'voffset', 'x', 'y', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'fill-rule', 'fill-opacity', 'clip-path', 'clip-rule', 'mask', 'opacity', 'filter', 'text-anchor', 'dominant-baseline', 'letter-spacing', 'word-spacing', 'writing-mode', 'glyph-orientation-vertical', 'glyph-orientation-horizontal'],
    ALLOWED_CLASSES: { '*': /^(katex|katex-display|pstrut|strut|vlist.*|svg-align|accent.*|mord.*|mbin|mrel|mopen|mclose|minner|mop|mpunct|msupsub.*|mfrac|mspace|mtable|mtr|mtd|mrow|mi|mn|mo|ms|mstyle|math|semantics|annotation|base|col|col-align-c|col-align-r|col-align-l|sizing|nulldelimiter|delimcenter|accent-body|mtight|tex-txt-[a-zA-Z0-9_-]+|boxpad)$/ },
    USE_PROFILES: { html: true, svg: true, mathMl: true },
    ALLOW_DATA_ATTR: false,
  };

  const renderMCPToolCallStatus = () => {
    if (!message.mcpToolCalls || message.mcpToolCalls.length === 0) return null;
    return (
      <div className="mt-3 space-y-2 w-full">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center">
          <Settings size={12} className="mr-1 flex-shrink-0" />
          MCP工具调用
        </div>
        {message.mcpToolCalls.map((toolCall) => (
          <div key={toolCall.tool_call_id} className="bg-[var(--color-panel)] rounded-lg p-3 border border-gray-200 dark:border-gray-700 w-full min-w-0">
            <div className="flex items-center justify-between mb-2 min-w-0">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{toolCall.tool_name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">来自 {toolCall.server_name}</span>
              </div>
              <div className="flex items-center flex-shrink-0 ml-2">
                {toolCall.status === 'calling' && <span className="flex items-center text-xs text-[var(--color-primary)] whitespace-nowrap"><RefreshCw size={12} className="mr-1 animate-spin flex-shrink-0" />调用中...</span>}
                {toolCall.status === 'success' && <span className="flex items-center text-xs text-green-600 dark:text-green-400 whitespace-nowrap"><CheckCircle size={12} className="mr-1 flex-shrink-0" />成功</span>}
                {toolCall.status === 'error' && <span className="flex items-center text-xs text-red-600 dark:text-red-400 whitespace-nowrap"><AlertCircle size={12} className="mr-1 flex-shrink-0" />失败</span>}
              </div>
            </div>
            {toolCall.result && <div className="mt-2 w-full min-w-0"><div className="text-xs text-gray-600 dark:text-gray-400 mb-1">结果:</div><div className="text-xs bg-white dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-600 font-mono max-h-32 overflow-y-auto w-full break-all">{toolCall.result}</div></div>}
            {toolCall.error && <div className="mt-2 w-full min-w-0"><div className="text-xs text-red-600 dark:text-red-400 mb-1">错误:</div><div className="text-xs bg-red-50 dark:bg-red-900/20 rounded p-2 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 w-full break-all">{toolCall.error}</div></div>}
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (isEditing && role === 'user') {
      return (
        <div className="mt-1 space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full text-sm border-primary focus:ring-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
              if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); }
            }}
          />
          <div className="flex justify-end space-x-2">
            <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="text-xs"><XCircle size={14} className="mr-1" />取消</Button>
            <Button size="sm" onClick={handleSaveEdit} className="text-xs"><Save size={14} className="mr-1" />保存</Button>
          </div>
        </div>
      );
    }

    if (isLoading && !content && (!message.tool_calls || message.tool_calls.length === 0)) {
      return <span className="italic text-gray-500">AI正在思考...</span>;
    }

    if (error) {
      return <span className="text-red-500">错误: {error}</span>;
    }

    if (!content && (!message.tool_calls || message.tool_calls.length === 0)) {
        // Only return null if there is absolutely nothing to render.
        // If there are tool calls, we should still render the container.
        return null;
    }

    const contentParts = Array.isArray(content) ? content : [{ type: 'text', text: content }];

    return (
      <div className="prose dark:prose-invert max-w-none space-y-4">
        {contentParts.map((part, index) => {
          if (part.type === 'image' && 'src' in part) {
            return <img key={index} src={part.src} alt="User attachment" className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700" />;
          }
          if (part.type === 'text' && 'text' in part) {
            const katexExpressions: { placeholder: string; katexHtml: string; displayMode: boolean }[] = [];
            let placeholderIndex = 0;
            let processedMdContent = part.text || "";
            processedMdContent = processedMdContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, latexExp) => {
              const placeholder = `__KATEX_BLOCK_PLACEHOLDER_${placeholderIndex++}__`;
              try {
                katexExpressions.push({ placeholder, katexHtml: katex.renderToString(latexExp.trim(), { displayMode: true, throwOnError: true, strict: "warn", output: "htmlAndMathml" }), displayMode: true });
              } catch (e: any) {
                const errorMsg = String(e.message || 'Unknown KaTeX Error').replace(/"/g, "&quot;").replace(/'/g, "&apos;");
                const latexInputPreview = latexExp.trim().substring(0, 100).replace(/</g, "&lt;").replace(/>/g, ">&gt;");
                katexExpressions.push({ placeholder, katexHtml: `<span class="text-red-500" title="KaTeX Error: ${errorMsg}">[KaTeX Error: ${(e as any).name || 'UnknownError'}] Input: $$${latexInputPreview}$$...</span>`, displayMode: true });
              }
              return placeholder;
            });
            processedMdContent = processedMdContent.replace(/(?<![\\\$])\$([\s\S]+?)\$(?!\$)/g, (match, latexExp) => {
              const placeholder = `__KATEX_INLINE_PLACEHOLDER_${placeholderIndex++}__`;
              try {
                let resolvedDisplayMode = false;
                if (latexExp.includes('\\begin{鉴定}') || latexExp.includes('\n') || latexExp.includes('\\\\')) {
                  resolvedDisplayMode = true;
                }
                katexExpressions.push({ placeholder, katexHtml: katex.renderToString(latexExp.trim(), { displayMode: resolvedDisplayMode, throwOnError: true, strict: "warn", output: "htmlAndMathml" }), displayMode: resolvedDisplayMode });
              } catch (e: any) {
                const errorMsg = String(e.message || 'Unknown KaTeX Error').replace(/"/g, "&quot;").replace(/'/g, "&apos;");
                const latexInputPreview = latexExp.trim().substring(0, 100).replace(/</g, "&lt;").replace(/>/g, ">&gt;");
                katexExpressions.push({ placeholder, katexHtml: `<span class="text-red-500" title="KaTeX Error: ${errorMsg}">[KaTeX Error: ${(e as any).name || 'UnknownError'}] Input: $${latexInputPreview}$...</span>`, displayMode: false });
              }
              return placeholder;
            });
            let htmlOutput = marked.parse(processedMdContent, customMarkedOptions) as string;
            katexExpressions.forEach(expr => {
              const placeholderCoreContent = expr.placeholder.substring(2, expr.placeholder.length - 2);
              const escapedCoreContent = placeholderCoreContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const escapedOriginalPlaceholder = expr.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const originalPlaceholderRegex = new RegExp(escapedOriginalPlaceholder, 'g');
              const strongWrappedContentRegex = new RegExp(`<strong>${escapedCoreContent}</strong>`, 'g');
              const pWrappedOriginalPlaceholderRegex = new RegExp(`<p>${escapedOriginalPlaceholder}</p>`, 'g');
              const pWrappedStrongContentRegex = new RegExp(`<p>${strongWrappedContentRegex.source}</p>`, 'g');
              let replaced = false;
              if (expr.displayMode) {
                if (pWrappedStrongContentRegex.test(htmlOutput)) { htmlOutput = htmlOutput.replace(pWrappedStrongContentRegex, expr.katexHtml); replaced = true; }
                else if (pWrappedOriginalPlaceholderRegex.test(htmlOutput)) { htmlOutput = htmlOutput.replace(pWrappedOriginalPlaceholderRegex, expr.katexHtml); replaced = true; }
                else if (strongWrappedContentRegex.test(htmlOutput)) { htmlOutput = htmlOutput.replace(strongWrappedContentRegex, expr.katexHtml); replaced = true; }
              } else {
                if (strongWrappedContentRegex.test(htmlOutput)) { htmlOutput = htmlOutput.replace(strongWrappedContentRegex, expr.katexHtml); replaced = true; }
              }
              if (!replaced) {
                if (originalPlaceholderRegex.test(htmlOutput)) { htmlOutput = htmlOutput.replace(originalPlaceholderRegex, expr.katexHtml); }
              }
            });
            const sanitizedMarkup = DOMPurify.sanitize(htmlOutput, DOMPURIFY_CONFIG_FOR_KATEX);
            return <div key={index} dangerouslySetInnerHTML={{ __html: sanitizedMarkup }} />;
          }
          return null;
        })}
      </div>
    );
  };

  const getAvatar = () => {
    const nameInitial = user?.name ? user.name.charAt(0).toUpperCase() : role.charAt(0).toUpperCase();
    const avatarIcon = role === "user" ? <User size={20} /> : <Bot size={20} />;
    return (
      <Avatar className="w-8 h-8">
        {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name || role} /> : <AvatarFallback className="text-sm bg-gray-200 dark:bg-gray-700 flex items-center justify-center">{avatarIcon}</AvatarFallback>}
      </Avatar>
    );
  };

  const userMessageClasses = "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] dark:bg-[var(--color-primary)] dark:text-[var(--color-primary-foreground)]";
  const assistantMessageClasses = "bg-gray-100 text-gray-800 dark:bg-[var(--color-card)] dark:text-gray-100";
  const messageBgColor = role === "user" ? userMessageClasses : assistantMessageClasses;
  const userBubbleCorners = "rounded-br-none";
  const assistantBubbleCorners = "rounded-bl-none";
  const bubbleCorners = role === "user" ? userBubbleCorners : assistantBubbleCorners;

  return (
    <div ref={messageRootRef} className={classNames("flex flex-col group mb-6", { "items-end": role === "user", "items-start": role !== "user" })}>
      <div className={classNames("flex w-full", { "justify-end": role === "user" })}>
        {role !== "user" && <div className="mr-2 md:mr-3 shrink-0 self-end">{getAvatar()}</div>}
        <div className={classNames("p-3 max-w-[85%] md:max-w-[70%] break-words relative shadow-sm", messageBgColor, "rounded-xl", bubbleCorners)}>
          {renderContent()}
          {renderMCPToolCallStatus()}
          <div className="text-xs mt-1.5 opacity-70 text-right">{new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        {role === "user" && <div className="ml-3 shrink-0 self-end">{getAvatar()}</div>}
      </div>
      {!isLoading && !isEditing && (content || role === 'assistant') && (
        <div className={classNames("flex items-center space-x-2 mt-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100", { "pr-12": role === "user", "pl-12": role !== "user" })}>
          {onResend && role === "assistant" && (error || content || (message.tool_calls && message.tool_calls.length > 0)) && <button onClick={() => onResend(messageId)} title="重新生成" className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded"><RefreshCw size={14} /></button>}
          {role === "user" && onEditMessage && getTextContent(content) && <button onClick={handleEditClick} title="编辑" className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded"><Edit3 size={14} /></button>}
          {getTextContent(content) && onCopy && <button onClick={() => onCopy(getTextContent(content))} title="复制" className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded"><Copy size={14} /></button>}
          {onBranch && !isLoading && <button onClick={() => onBranch(messageId)} title="创建分支" className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 rounded"><GitFork size={14} /></button>}
          {onDelete && <button onClick={() => onDelete(messageId)} title="删除" className="p-1 text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 rounded"><Trash2 size={14} /></button>}
        </div>
      )}
    </div>
  );
};

export default MessageItem;