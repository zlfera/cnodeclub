/**
 * 暴露 Topic 相关的 API
 * @author heroic
 */

/**
 * Module dependencies
 */
var async = require('async'),
  marked = require('../utils/marked'),
  models = require('../models'),
  Topic = models.Topic;

/**
 * 根据查询条件获取话题
 * @param  {Object}   options  查询选项
 *  - conditions  {Object}   查询条件，默认查询全部
 *  - pageIndex   {Number}   当前页数，默认为第1页
 *  - pageSize    {Number}   每页记录条数，默认20条
 *  - fields      {Object|String}  需要返回的字段，默认全部
 *  - sort        {Object}   排序条件，默认按创建时间和最后评论时间逆序排序
 * @param  {Function} callback 回调函数
 *  - err     MongooseError
 *  - topics  话题数组
 */
exports.query = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  var conditions = options.conditions,
    pageIndex = options.pageIndex || 1,
    pageSize = options.pageSize || 20,
    fields = options.fields || null,
    sort = options.sort || {
      lastCommentedAt: -1,
      createdAt: -1
    },
    query = Topic.query();

  query = query.find(conditions)
    .sort(sort);

  if (fields) {
    query = query.select(fields);
  }

  query = query.skip((pageIndex - 1) * pageSize).limit(pageSize);

  query.exec(callback);
};

/**
 * 发表新话题
 * @param  {Object}   topicData 话题对象
 * @param  {Function} callback  回调函数
 *  - err     MongooseError|Error
 */
exports.create = function(topicData, callback) {
  async.waterfall([
    function processMarkdown(next) {
      marked(topicData.content, function(err, htmlContent) {
        next(err, htmlContent);
      });
    },
    function createTopic(htmlContent, next) {
      topicData.htmlContent = htmlContent;
      Topic.create(topicData, function(err) {
        next(err);
      });
    }
  ], callback);
};

/**
 * 增加话题的浏览数
 * @param  {String}   id       话题 id
 * @param  {Function} callback 回调函数
 *  - err     MongooseError|Error
 *  - latestTopic   最新的 topic 对象
 */
exports.increaseViewsCount = function(id, callback) {
  Topic.findByIdAndUpdate(id, {
    $inc: {
      viewsCount: 1
    }
  }, function(err, latestTopic) {
    callback(err, latestTopic);
  });
};

/**
 * 根据话题 id 获取话题
 * @param  {String}   id       话题 id
 * @param  {Function} callback  回调函数
 *  - err     MongooseError
 *  - topic   话题对象
 */
exports.getById = function(id, callback) {
  Topic.findById(id, callback);
};