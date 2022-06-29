class VirtualScroll {
  constructor($list, list, itemGenerator) {
    this.$list = $list;
    this.list = list;
    this.itemGenerator = itemGenerator;
    this.cacheCount = 5;
    this._offset = 0;
    this.contentHeight = 0;
    this.cacheList = [];

    this.initItemList(list);
    this.initHeight($list);
    this.bindEvents();

    this.offset = this._offset;
  }

  get offset() {
    return this._offset;
  }

  set offset(val) {
    this.render(val);
    return (this._offset = val);
  }

  initItemList(list) {
    this._list = list.map((v, i) => {
      return {
        index: i,
        value: v,
        height: 30,
      };
    });

    console.log(this._list[0]);
  }

  initHeight($list) {
    this.containerHeight = $list.clientHeight;
    this.contentHeight = calcHeight(this._list);
    this.$list.style.overflow = "hidden";
  }

  bindEvents() {
    let y = 0;
    const _updateY = (e) => {
      e.preventDefault();
      y += e.deltaY;
      y = Math.max(y, 0);
      y = Math.min(y, this.contentHeight - this.containerHeight);
    };
    const updateOffset = (e) => {
      e.preventDefault();
      if (y !== this.offset) {
        this.offset = y;
      }
    };

    const _updateOffset = throttle(updateOffset, 50);

    this.$list.addEventListener("mousewheel", _updateY);
    this.$list.addEventListener("mousewheel", _updateOffset);
  }

  render(_offset) {
    const headIndex = findOffsetIndex(this._list, _offset);
    const tailIndex = findOffsetIndex(
      this._list,
      _offset + this.containerHeight
    );

    if (withinCacheList(headIndex, tailIndex, this.cacheList)) {
      const headCacheIndex = this.cacheList[0].index;
      const offsetToEdge = _offset - calcHeight(this._list, 0, headCacheIndex);
      this.wrapper.style.transform = `translateY(-${offsetToEdge}px)`;
      return;
    }

    console.log("重新生成DOM");

    if (!this.wrapper) {
      const e = document.createElement("div");
      e.classList.add("vs_wrapper");
      this.wrapper = e;
      this.$list.innerHTML = "";
      this.$list.appendChild(e);
    }

    const headCacheIndex = Math.max(headIndex - this.cacheCount, 0);
    const tailCacheIndex = Math.min(
      tailIndex + this.cacheCount,
      this._list.length - 1
    );

    this.cacheList = this._list.slice(headCacheIndex, tailCacheIndex + 1);
    const offsetToEdge = _offset - calcHeight(this._list, 0, headCacheIndex);

    const fragment = document.createDocumentFragment();

    this.cacheList.forEach((v) => {
      const $v = this.itemGenerator(v);
      fragment.appendChild($v);
    });

    this.wrapper.innerHTML = "";
    this.wrapper.appendChild(fragment);

    this.wrapper.style.transform = `translateY(-${offsetToEdge}px)`;
  }
}

function throttle(f, delay) {
  let timer, lastTime;
  return function (...args) {
    const now = Date.now();

    if (!lastTime) {
      lastTime = now;
      f.apply(f, args);
      return;
    }
    if (timer) {
      return;
    }

    const remain = now - lastTime > delay ? 0 : delay;

    timer = setTimeout(() => {
      f.apply(this, args);

      lastTime = Date.now();
      timer = null;
    }, remain);
  };
}

function findOffsetIndex(list, offset) {
  let height = 0;
  for (let i = 0; i < list.length; i++) {
    height += list[i].height;

    if (height > offset) return i;
  }

  return list.length - 1;
}

function calcHeight(list, start = 0, end = list.length) {
  let height = 0;
  for (let i = start; i < end; i++) {
    height += list[i].height;
  }

  return height;
}

function withinCacheList(head, end, cacheList) {
  if (!cacheList.length) return false;

  const cacheHead = cacheList[0];
  const cacheEnd = cacheList[cacheList.length - 1];

  const within = (num, min, max) => num >= min && num <= max;

  return (
    within(head, cacheHead.index, cacheEnd.index) &&
    within(end, cacheHead.index, cacheEnd.index)
  );
}
