var path = require("path");
var webpack = require("webpack");

module.exports = {
  resolve: {
    root: [path.join(__dirname, "bower_components")]
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /(node_modules)|(bower_components)/, loader: 'babel-loader'}
    ]
  },
  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
    ),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
};
