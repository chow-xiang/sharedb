'use strict'


// 客户端传来的指令
exports.MEMO_SEND_ORDERS = 'memo/client/order/+/sync'

// 重新拉取 redis 存储的 recording 记录
exports.MEMO_REFRESH_RECORDINGS = 'memo/recods/+/refresh'

// 录音结束指令
exports.MEMO_CLIENT_STOP = 'memo/client/order/+/stop'
