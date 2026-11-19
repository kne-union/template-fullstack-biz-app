const {CracoRemoteComponentsPlugin} = require("@kne/modules-dev");
const aliasConfig = require("./webstorm.webpack.config");

process.env.CI = false;

module.exports = {
    webpack: {
        alias: aliasConfig.resolve.alias, configure: (webpackConfig) => {
            const definePlugin = webpackConfig.plugins.find((plugin) => plugin.constructor.name === "DefinePlugin");
            Object.assign(definePlugin.definitions["process.env"], {
                DEFAULT_VERSION: `"${process.env.npm_package_version}"`
            });
            return webpackConfig;
        }
    }, plugins: [{
        plugin: CracoRemoteComponentsPlugin,
        // React Compiler 由 @kne/modules-dev 内置（编译器与 runtime 均已随包安装），React 18/19 适用
        options: {reactCompiler: true}
    }]
};
