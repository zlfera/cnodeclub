/**
 * 节点相关的 API
 * @author heroic
 */

/**
 * Module dependencies
 */
var async = require('async'),
  _ = require('lodash'),
  models = require('../models'),
  Tag = models.Tag;

/**
 * 获取节点列表
 * @param  {Object}   options
 *  - query          optional   查询条件，默认查询全部
 *  - notPaged       optional   不分页则传入 true，默认 false
 *  - pageIndex      optional   当前页数，默认 1
 *  - pageSize       optional   返回的记录数，默认 20
 *  - sort  {Object} optional   排序规则，默认按创建时间倒序
 * @param  {Function} callback
 *  - err
 *  - results
 *    - totalCount  符合查询条件的节点记录总数
 *    - tags        节点列表
 */
exports.query = function(options, callback) {
  options = options || {};
  var conditions = options.query || options.conditions || {};

  Tag.paginate(conditions, options, function(err, count, tags) {
    if (err) {
      return callback(err);
    }

    // `notPaged === true` 的情况
    if (typeof tags === 'undefined') {
      return callback(null, { tags: count });
    }

    callback(null, {
      totalCount: count,
      tags: tags
    });
  });
};

/**
 * 根据 id 或节点名获取节点
 * @param  {Object}   tagData
 *  - id    节点 id
 *  - name  节点名
 * @param  {Function} callback
 *  - err
 *  - tag     节点对象
 */
exports.get = function(tagData, callback) {
  var id = tagData.id,
    name = tagData.name,
    slug = tagData.slug,
    userId = this.currentUser && this.currentUser.id;

  async.waterfall([
    function getTag(next) {
      if (id) {
        Tag.findById(id, function(err, tag) {
          next(err, tag);
        });
      } else if (name || slug) {
        Tag.findOne({
          $or: [{
            name: name
          }, {
            slug: slug
          }]
        }, function(err, tag) {
          next(err, tag);
        });
      }
    },
    function checkFavorite(tag, next) {
      if (!userId || !tag) {
        return next(null, tag);
      }
      tag.isFavoritedBy(userId, function(err, favorited) {
        if (err) {
          return next(err);
        }
        next(null, _.extend(tag, {
          isFavorited: favorited
        }));
      });
    }
  ], callback);
};

/**
 * 根据条件统计节点数量
 * @param  {Object}   conditions 筛选条件
 * @param  {Function} callback
 *  - err
 *  - count
 */
exports.count = function(conditions, callback) {
  if (typeof conditions === 'function') {
    callback = conditions;
    conditions = {};
  }
  Tag.count(conditions, callback);
};

/**
 * 创建节点
 * @param  {Object}   tagData    节点对象
 * @param  {Function} callback
 *  - err
 *  - tag
 */
exports.create = function(tagData, callback) {
  Tag.create(tagData, callback);
};

/**
 * 根据主键编辑节点
 * @param  {Object}   tagData   节点对象
 *  - id|_id    required    节点 id
 * @param  {Function} callback
 *  - err
 *  - tag
 */
exports.edit = function(tagData, callback) {
  var id = tagData.id || tagData._id;
  tagData._id && delete tagData._id;

  async.waterfall([
    function getTag(next) {
      Tag.findById(id, function(err, tag) {
        next(err, tag);
      });
    },
    function updateTag(tag, next) {
      if (!tag) {
        return next(null, tag);
      }
      _.extend(tag, tagData);
      tag.save(function(err, tag) {
        next(err, tag);
      });
    }
  ], callback);
};

/**
 * 根据主键删除节点
 * @param  {Object}   args
 *  - id     required   节点 id
 * @param  {Function} callback
 *  - err
 *  - section
 */
exports.remove = function(args, callback) {
  var id = args.id;
  async.waterfall([
    function getSection(next) {
      Tag.findById(id, function(err, section) {
        next(err, section);
      });
    },
    function removeSection(section, next) {
      if (!section) {
        return next(null, section);
      }
      section.remove(function(err, section) {
        next(err, section);
      });
    }
  ], callback);
};