import compression from 'vite-plugin-compression';
export default function createCompression(env) {
    var VITE_BUILD_COMPRESS = env.VITE_BUILD_COMPRESS;
    var compressList = VITE_BUILD_COMPRESS.split(',');
    var plugin = [];
    if (compressList.includes('gzip')) {
        plugin.push(compression({
            ext: '.gz',
            deleteOriginFile: false,
        }));
    }
    if (compressList.includes('brotli')) {
        plugin.push(compression({
            ext: '.br',
            algorithm: 'brotliCompress',
            deleteOriginFile: false,
        }));
    }
    return plugin;
}
