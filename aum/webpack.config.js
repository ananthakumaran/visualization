module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [ 'esnext', { modules: false } ]
          ]
        }
      },
      {
        test: /\.csv$/,
        loader: 'raw-loader'
      }
    ]
  }
};
