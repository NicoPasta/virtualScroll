class VirtualScroll {
  constructor(c, list, itemGenerator, cacheCount) {
    // console.log(c)
    this.container = c
    this.list = list
    this.cacheList = []
    this._offset = 0
    this.offsetToEdge = 0
    this.cacheCount = cacheCount || 6
    this.itemGenerator = itemGenerator
    this.contentHeight = 0

    this.initItem(list)
    this.initContainer(c)
    this.bindEvents()

    this.offset = this._offset
  }

  get offset() {
    return this._offset
  }

  set offset(val) {
    this.render(val)
    this._offset = val
    return true
  }
  // 转换数组，附加上高度和index
  initItem(list) {
    this._list = list.map((item, index) => {
      return {
        item: item,
        height: 40,
        index: index
      }
    })
  }

  // 初始化containerHeight和container overflow:hidden
  initContainer(container) {
    this.containerHeight = container.clientHeight
    this.contentHeight = calc(this._list)
    this.container.style.overflow = 'hidden'
  }

  bindEvents() {
    let y = 0
    // 滚动的最大高度
    const maxOffset = this.contentHeight - this.containerHeight
    const _updateY = (event) => {
      event.preventDefault()
      y += event.deltaY
      // 向上为负值，但y最小为0
      y = Math.max(y, 0)
      // 最大偏移量为maxOffset
      y = Math.min(y, maxOffset)
    }

    const updateOffset = () => {
      if (y !== this.offset) this.offset = y
    }

    const _updateOffset = throttle(updateOffset, 30)

    // 更新y
    this.container.addEventListener('mousewheel', _updateY)
    //   更新offset
    this.container.addEventListener('mousewheel', _updateOffset)

    // 解除绑定事件
    this.unbindEvents = () => {
      this.container.removeEventListener('mousewheel', _updateY)
      this.container.removeEventListener('mousewheel', _updateOffset)
    }
  }

  render(_offset) {
    const headIndex = findIndex(this._list, _offset)
    const tailIndex = findIndex(this._list, _offset + this.containerHeight)

    if (withCache(headIndex, tailIndex, this.cacheList)) {
      const headIndexWithCache = this.cacheList[0].index
      const offsetToEdge = _offset - calc(this._list, 0, headIndexWithCache)
      this.container.style.transform = `translateY(-${offsetToEdge}px)`
      return
    }
    console.log('重新渲染')
    // const heightSum = calc(this._list, 0, headIndex)

    //   根据当前head和tail计算缓存列表的首尾index
    const headIndexWithCache = Math.max(headIndex - this.cacheCount, 0)
    const tailIndexWithCache = Math.min(
      tailIndex + this.cacheCount,
      this._list.length - 1
    )

    //   计算缓存列表
    this.cacheList = this._list.slice(headIndexWithCache, tailIndexWithCache + 1)

    this.offsetToEdge = _offset - calc(this._list, 0, headIndexWithCache)

    // this.renderList = this._list.slice(headIndex, tailIndex + 1)
    if (!this.itemWrapper) {
      const itemWrapper = document.createElement('div')
      itemWrapper.classList.add('vs__inner')
      this.container.appendChild(itemWrapper)
      this.itemWrapper = itemWrapper
    }

    const fragment = document.createDocumentFragment()

    //   根据缓存列表添加元素至fragement
    this.cacheList.forEach((v) => {
      const item = this.itemGenerator(v)
      fragment.appendChild(item)
    })

    // this.renderList.forEach((v) => {
    //   const item = this.itemGenerator(v)
    //   fragment.appendChild(item)
    // })

    this.itemWrapper.innerHTML = ''

    this.itemWrapper.appendChild(fragment)

    //   每次监听到事件都重新渲染，然后计算出向上偏移量
    this.itemWrapper.style.transform = `translateY(-${this.renderOffset}px)`

    // 生成虚拟列表并保存到wrapper
  }
}

// function throttle(f, delay) {
//   let timer, lastTime

//   return function (...args) {
//     const now = Date.now()
//     // 第一次立刻执行
//     if (!lastTime) {
//       lastTime = now
//       f.apply(f, args)
//       return
//     }

//     if (timer) {
//       return
//     }

//     // 如果间隔时间比delay久，那么立即执行f
//     const remain = now - lastTime > delay ? 0 : delay

//     timer = setTimeout(() => {
//       f.apply(this, args)
//       // 每次执行完更新lastTime，以保证间隔
//       lastTime = Date.now()
//       timer = null
//     }, remain)
//   }
// }

function throttle(fn, wait) {
  let timer, lastApply

  return function (...args) {
    const now = Date.now()
    if (!lastApply) {
      lastApply = now
      fn.apply(this, args)

      return
    }

    if (timer) return
    const remain = now - lastApply > wait ? 0 : wait

    timer = setTimeout(() => {
      fn.apply(this, args)
      lastApply = Date.now()
      timer = null
    }, remain)
  }
}

// 找比高度和比offset大的那个元素
function findIndex(list, offset) {
  let height = 0
  for (let i = 0; i < list.length; i++) {
    height += list[i].height

    if (height > offset) return i
  }

  // 不存在元素高度和大于offset时，说明二者相等
  return list.length - 1
}

//  计算list从start到end的高度
function calc(list, start = 0, end = list.length) {
  let height = 0
  for (let i = start; i < end; i++) {
    height += list[i].height
  }

  return height
}

function withCache(head, end, cacheList) {
  if (!cacheList.length) return false

  const cacheHead = cacheList[0]
  const cacheEnd = cacheList[cacheList.length - 1]

  const within = (num, min, max) => {
    num >= min && num <= max
  }

  return within(head, cacheHead, cacheEnd) && within(end, cacheHead, cacheEnd)
}
