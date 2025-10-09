// ▼ 記事の読み込みに関わるメイン処理（処理全体は動作に必須なので削除・改変NG／初期記事ファイル名は編集OK）
window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(location.search);
    const articleFile = params.get("article") || "article1.md";

    // ▼ Markdownファイルを取得（ファイル名やパスを変更する場合はarticlesフォルダ内に合わせて編集OK）
    fetch(`articles/${articleFile}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.text();
        })
        .then(mdText => {
            // ▼ Front Matter（冒頭のメタ情報）を切り出し（構造解析は動作に必須なので削除NG）
            const frontMatterMatch = mdText.match(/^---\n([\s\S]*?)\n---\n?/);
            let frontMatter = {};
            if (frontMatterMatch) {
                const fmText = frontMatterMatch[1];
                fmText.split('\n').forEach(line => {
                    const [key, ...rest] = line.split(':');
                    if (key && rest.length > 0) {
                        frontMatter[key.trim()] = rest.join(':').trim();
                    }
                });

                // ▼ Front Matter部分はHTMLに出力しないため本文から除外（削除NG）
                mdText = mdText.slice(frontMatterMatch[0].length);
            }

            // ▼ Markdown本文をHTMLへ変換（markedライブラリ利用部分は削除NG／追加の加工はここで挿入OK）
            const html = marked.parse(mdText);
            const contentEl = document.getElementById("content");
            contentEl.innerHTML = html;

            // ▼ 画像にレスポンシブ用クラスを追加（class名追加は編集OK／ループ自体は削除NG）
            contentEl.querySelectorAll("img").forEach(img => {
                img.classList.add("img-fluid");
            });

            // ▼ YouTubeリンクを埋め込みに変換（不要なら丸ごと削除OK／他のサービス対応を追加してもOK）
            contentEl.querySelectorAll("a").forEach(link => {
                const href = link.href;
                const match = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                if (match) {
                    const videoId = match[1];
                    const wrapper = document.createElement("div");
                    wrapper.className = "ratio ratio-16x9 mb-4";

                    const iframe = document.createElement("iframe");
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                    iframe.referrerPolicy = "strict-origin-when-cross-origin";
                    iframe.allowFullscreen = true;
                    iframe.title = "YouTube video player";

                    wrapper.appendChild(iframe);
                    link.replaceWith(wrapper);
                }
            });

            // ▼ Front Matterからタイトル・日付を表示（IDはHTMLと連動するため変更NG／テキスト加工の追加は編集OK）
            if (frontMatter.title) {
                const titleEl = document.getElementById("article-title");
                if (titleEl) titleEl.textContent = frontMatter.title;
                document.title = frontMatter.title;
            }
            if (frontMatter.date) {
                const dateEl = document.getElementById("article-date");
                if (dateEl) dateEl.textContent = frontMatter.date;
            }

            generateToc();

            // ▼ コードハイライトを有効化（別ライブラリへ差し替えたい場合はここを編集）
            hljs.highlightAll();
        })
        .catch(err => {
            document.getElementById("content").innerHTML =
                `<p style="color: red;">読み込みエラー: ${err.message}</p>`;
        });
});

/**
 * ▼ 目次生成関数（関数名はmain.jsから参照されるため変更NG）
 *   - 目次に含める見出しレベルはquerySelectorAllの指定を編集OK
 */
function generateToc() {
    const tocContainer = document.getElementById("article-toc");
    tocContainer.innerHTML = ""; // ▼ 既存の目次をリセット（削除NG）

    const headings = document.querySelectorAll("#content h1, #content h2");
    headings.forEach(heading => {
        if (!heading.id) {
            // ▼ 見出しテキストからIDを生成（生成方法は編集OK／ID付与自体は削除NG）
            heading.id = heading.textContent.replace(/\s+/g, "-").toLowerCase();
        }
        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;

        const level = parseInt(heading.tagName[1], 10) || 1;
        link.classList.add(`toc-level-${level}`);

        tocContainer.appendChild(link);
    });
}
