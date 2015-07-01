webpack = require 'webpack'

module.exports =

  context: __dirname

  entry:
    index: './index.jsx'
    bundle: [
      'c3'
      'lodash'
      'vue'
    ]

  output:
    path: './'
    publicPath: './'
    filename: '[name].js'
    chunkFilename: 'chunk-[id].js'

  module:
    loaders: [
      { test: /\.css$/,   loader: 'style/url!file?name=[name].[ext]' }
      { test: /\.jsx$/,   exclude: /node_modules|bower_components/, loader: 'babel?stage=0' }
      { test: /\.json$/,  exclude: /node_modules|bower_components/, loader: 'json'          }
      { test: /\.ya?ml$/, exclude: /node_modules|bower_components/, loader: 'json!yaml'     }
    ]

  resolve:
    extensions: [
      ''
      '.js'
      '.json'
    ]
    modulesDirectories: [
      'node_modules'
      'bower_components'
    ]

  plugins: [
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
    )
    new webpack.NoErrorsPlugin
    new webpack.IgnorePlugin(/vertx/)
    new webpack.optimize.OccurenceOrderPlugin
    new webpack.optimize.DedupePlugin
    new webpack.optimize.AggressiveMergingPlugin
    new webpack.optimize.CommonsChunkPlugin('bundle', 'bundle.js')
  ].concat(
    if process.argv.some (arg) ->
      /^(?:-p|--optimize-minimize)$/.test(arg)
    then [
      new webpack.DefinePlugin(
        log: -> return
      )
      new webpack.optimize.UglifyJsPlugin(
        output: comments: require('uglify-save-license')
      )
    ]
    else [
      new webpack.DefinePlugin(
        log: ->
          if console?
            # for IE8 and IE9
            if typeof console.log is 'object'
              Function::apply.call(console.log, console, arguments)
            # for other browsers
            else
              console.log.apply(console, arguments)
          return
      )
    ]
  )
