import { createHtmlPlugin } from 'vite-plugin-html';
export default function createHTML(env, isBuild) {
    return createHtmlPlugin({
        minify: isBuild,
        inject: {
            tags: isBuild
                ? [
                    {
                        tag: "script",
                        attrs: {
                            src: "".concat(env.VITE_BASE_URL, "/_app.config.js"),
                        },
                    },
                ]
                : [],
        },
    });
}
