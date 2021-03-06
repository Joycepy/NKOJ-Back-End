const router = require('express').Router()
const db = require('../database/db')
const fc = require('../lib/form-check')

const listProblem = async (req, res) => {
  'use strict'
  let form = req.fcResult
  let offset = form.l || 0
  let requested = form.r || 20
  let limit = requested > 50 ? 50 : requested
  let result = await db.query('SELECT * FROM problems order by problem_id limit $1 offset $2', [limit, offset])
  
  //oi check
  let c_ret = await db.query('SELECT * FROM contest_problems LEFT JOIN contests ON contest_problems.contest_id = contests.contest_id WHERE CURRENT_TIMESTAMP < upper(contests.during) AND contests.rule=\'oi\'')
  let c_dic = {}
  c_ret.rows.forEach(function(c_p, index){
    c_dic[c_p["problem_id"]] = "OI"
  })
  result.rows.forEach(function(p, index){
    if(typeof(c_dic[p.problem_id]) != "undefined"){
      p.ac = 0
    } 
  })

  //acm check
  c_ret = await db.query('SELECT * FROM secret_time WHERE CURRENT_TIMESTAMP < UPPER(during) AND CURRENT_TIMESTAMP > lower(during)')
  if(c_ret.rows.length > 0){
    result.rows.forEach(function(p, index){
      p.ac = 0
    })
  }

  return res.ok({
    requested: requested,
    served: result.rows.length,
    is_end: result.rows.length < limit,
    list: result.rows
  })
}

router.get('/:l(\\d+)?/:r(\\d+)?', fc.all(['l', 'r']), listProblem)
router.get('/list/:l(\\d+)?/:r(\\d+)?', fc.all(['l', 'r']), listProblem)

module.exports = router
