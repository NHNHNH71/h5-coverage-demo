const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isCoverageEnabled = process.env.ENABLE_COVERAGE === 'true';

// 如果启用覆盖率，设置 Babel 环境为 coverage，以启用 istanbul 插桩
if (isCoverageEnabled) {
  process.env.BABEL_ENV = 'coverage';
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
}

// 自定义插件：在启用覆盖率时复制 coverage-config.js
class CopyCoverageConfigPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyCoverageConfigPlugin', (compilation) => {
      if (isCoverageEnabled) {
        const templatePath = path.resolve(__dirname, 'coverage-config.template.js');
        const destPath = path.resolve(__dirname, 'dist', 'coverage-config.js');
        
        if (fs.existsSync(templatePath)) {
          fs.copyFileSync(templatePath, destPath);
          console.log('✓ coverage-config.js 已复制到 dist 目录');
        } else {
          console.warn('⚠ coverage-config.template.js 不存在，跳过复制');
        }
      }
    });
  }
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  devtool: isCoverageEnabled ? 'source-map' : 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: false, // 禁用缓存以确保插桩生效
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions'],
                  },
                },
              ],
            ],
            // 当启用覆盖率时，添加 istanbul 插件进行插桩
            ...(isCoverageEnabled
              ? {
                  plugins: [
                    [
                      'istanbul',
                      {
                        exclude: [
                          '**/*.spec.js',
                          '**/*.test.js',
                          '**/node_modules/**',
                          '**/dist/**',
                        ],
                      },
                    ],
                  ],
                }
              : {}),
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      templateParameters: {
        enableCoverage: isCoverageEnabled,
      },
    }),
    ...(isCoverageEnabled ? [new CopyCoverageConfigPlugin()] : []),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    open: true,
  },
};

