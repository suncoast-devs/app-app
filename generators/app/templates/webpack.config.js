const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const validate = require('webpack-validator')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const autoprefixer = require('autoprefixer')

const ROOT_PATH = path.resolve(__dirname)
const SRC_PATH = path.resolve(ROOT_PATH, 'client')
const BUILD_PATH = path.resolve(ROOT_PATH, 'public')

const common = {
  entry: [
    'whatwg-fetch',
    SRC_PATH
  ],
  output: {
    filename: 'bundle.js',
    path: BUILD_PATH,
    publicPath: '/'
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_PATH, 'index.html'),
      inject: 'body',
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      }
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      include: [SRC_PATH],
      loader: 'babel'
    }, {
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: 'file'
    }, {
      test: /\.(<%= sass ? 'sass|s?css' : 'css' %>)$/,
      loaders: [
        'style',
        'css?camelCase&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
        'postcss'<% if ( sass ) { %>,
        'sass'<% } %>
      ]
    }]
  },
  postcss: function () {
    return [autoprefixer]
  }
}

const development = {
  entry: [
<% if ( react ) { %>    'react-hot-loader/patch',<% } %>
    'webpack-hot-middleware/client?reload'
  ],
  output: {
    devtoolModuleFilenameTemplate: '[resource-path]'
  },
  devtool: 'eval',
  plugins: [
    new webpack.HotModuleReplacementPlugin({ multiStep: true })
  ]
}

const production = {
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
  ]
}

module.exports = validate(merge.smart(
  process.env.npm_lifecycle_event === 'build'
  ? production
  : development,
  common
))
