const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const ROOT_PATH = path.resolve(__dirname)
const SRC_PATH = path.resolve(ROOT_PATH, 'src')
const BUILD_PATH = path.resolve(ROOT_PATH, 'public')

const common = {
  entry: {
    vendor: [
      'whatwg-fetch',
      'babel-polyfill'<% if ( react ) { %>,
      'react-dom',
      'react'<% } %>
    ],
    app: SRC_PATH
  },
  output: {
    filename: 'app-[hash].js',
    path: BUILD_PATH,
    publicPath: '/'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_PATH, 'index.html'),
      inject: 'body',
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity,
      filename: 'vendor-[hash].js'
    })
  ],
  module: {
    rules: [{
      test: /\.js$/,
      include: [SRC_PATH],
      loader: 'babel-loader'
    }, {
      test: /\.(png|jpe?g|gif|svg)$/,
      loader: 'file-loader'
    }, {
      test: /\.(<%= sass ? 'sass|s?css' : 'css' %>)$/,
      loaders: [
        'style-loader',
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            plugins: () => {
              return [
                require('autoprefixer')
              ]
            }
          }
        }<% if ( sass ) { %>,
        'sass-loader'<% } %>
      ]
    }]
  }
}

const development = {
  entry: {
    vendor: [<% if ( react ) { %>
      'react-hot-loader/patch',<% } %>
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/only-dev-server'
    ]
  },
  output: {
    devtoolModuleFilenameTemplate: '[resource-path]'
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 8080,
    contentBase: BUILD_PATH,
    publicPath: '/',
    stats: { colors: true, chunks: false }
  },
  devtool: 'eval',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new BrowserSyncPlugin({ proxy: 'http://localhost:8080/' }, { reload: false })
  ],
  module: {
    rules: [{
      test: /\.html$/,
      loader: 'raw-loader'
    }]
  }
}

const production = {
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new ExtractTextPlugin('style-[hash].css')
  ]
}

module.exports = merge.smart(
  process.env.npm_lifecycle_event === 'build'
  ? production
  : development,
  common
)
