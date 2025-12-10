import * as path from "node:path";
import {fileURLToPath} from "node:url";
import env from "env-var";
import {defineConfig, PluginOption} from "vite";
import autoprefixer from "autoprefixer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


export default defineConfig({
    publicDir: path.resolve(__dirname, "public"),
    root: path.resolve(__dirname, "src"),
    plugins: [
        noCrossOriginAttributePlugin()
    ],
    base: "",
    server: {
        allowedHosts: process.argv.some((value, index, argv) => (
            value === "0.0.0.0" && argv[index - 1] === "--host"
        )) || undefined,
        hmr: !(
            env.get("DISABLE_LIVE_RELOAD")
                .default("false")
                .asBool()
        )
    },
    css: {
        postcss: {
            plugins: [
                autoprefixer({
                    flexbox: false,
                    grid: false
                })
            ]
        }
    },
    build: {
        emptyOutDir: true,
        outDir: path.resolve(__dirname, "dist"),
        copyPublicDir: true,
        assetsInlineLimit: 0,
        modulePreload: {
            polyfill: false
        },
        minify: "esbuild",
        cssMinify: "esbuild",
        rollupOptions: {
            output: {
                // format: "iife",
                entryFileNames: "[name].js",
                chunkFileNames: "js/[name].js",
                preserveModules: false,

                assetFileNames(assetInfo) {
                    for (const name of assetInfo.names) {
                        if ([
                            "favicon.png",
                            "favicon.svg",
                            "manifest.json"
                        ].includes(name))
                            return "[name][extname]";
                        else if (/\.(woff|woff2)$/i.test(name))
                            return "fonts/[name][extname]";
                        else if (/\.(css)$/i.test(name))
                            return "css/[name][extname]";
                        else if (/\.(png|jpg|jpeg|gif|webp)$/i.test(name))
                            return "img/[name][extname]";
                    }

                    return "assets/[name]-[hash][extname]";
                }
            },
            input: {
                index: path.resolve(__dirname, "src", "index.html")
            }
        }
    }
});

function noCrossOriginAttributePlugin() {
    return {
        name: "noCrossoriginAttributePlugin",
        transformIndexHtml(html: string) {
            return html
                .split('type="module" crossorigin')
                .join('type="module"')
                .split('rel="modulepreload" crossorigin')
                .join('rel="modulepreload"');
        }
    } satisfies PluginOption;
}
