/*
 *  Selection 快速选择插件
 *
 *  作者: Kevin
 *  QQ: 870483093
 */

function Selection (option){
  // 插件状态
  this.state = true;

  // 配置项
  this.option = $option = {
    // 选择项
    option: {
      e: '[selection-option]',

      // 选中添加class
      checked: 'selection-checked',
    },

    // 选择框
    selector: {
      id: 'selection-selector',

      // 添加class
      class: '',

      // 显示的层级
      zIndex: 99999,

      // 点击选中 (selector.whole = true 时无效)
      click: true,

      // 单击取消选中
      deselect: true,

      // 是否完全选择
      whole: false,

      // 内部选中
      inner: true,
    },

    // 选择容器
    container: {
      e: '#selection-container',

      // 边界 不会超出边界
      wall: true,

      // 范围 只有在容器内才能拉出选择框
      range: true,

      // user select 允许用户选择容器内的内容
      select: false,

      // 阻止默认行为 
      prevent: false,

      // 阻止事件冒泡 
      propagation: false, 
    },

    // 移动事件回调
    move: () => {},

    // 选择事件回调
    selected: () => {},

    ...option
  }

  // 被选中的元素
  this.selected = [];

  // 可被选中的元素
  this.option = Object;

  // 快速选择 element
  const $element = selector => {
    const type = {
      string: () => {
        const e = document.querySelectorAll(selector);
        return e.length > 1 ? e : e[0] || undefined;
      },
      object: () => { return selector },
    }
    return type[typeof(selector)]();
  }

  // 快速添加 style
  const $style = (selector, styles) => {
    const style = (element) => {
      Object.keys(styles).forEach( key => {
        element.style[key] = styles[key];
      })
    }

    const type = {
      object: () => style(selector),
      string: () => $element(selector).forEach(element => { style(element) }),
    }
    type[typeof(selector)]();
  }

  // 鼠标事件
  const mouse = {
    // 鼠标按下的位置
    start: {
      x: 0,
      y: 0,
    },

    // 鼠标移动形成的矩形
    area: {
      t: 0,
      l: 0,
      r: 0,
      b: 0,
    },

    // 鼠标按下
    down: event => {
      // 是否阻止默认行为
      $option.container.prevent && event.preventDefault();

      // 是否阻止使事件冒泡
      $option.container.propagation && event.stopPropagation();
      
      // 判断是否已经有这个元素了,如果存在，则清除
      $element('#' + $option.selector.id) && $element('#' + $option.selector.id).remove();

      // 单击是否清空
      $option.selector.deselect && (this.selected = [], $element($option.option.e).forEach(e => e.classList.remove($option.option.checked)));

      // 单击是否选中
      ($option.selector.click  && !$option.selector.whole) && ($element($option.option.e).forEach(e => e.classList.remove($option.option.checked)), event.path.forEach(e => {
        try{
          this.option.forEach(eo => {
            if(e == eo){ throw new Error; }
          })
        } catch {
          e.classList.add($option.option.checked)
          this.selected = [e];
        }        
      }))

      try{
        // 是否只有在容器内才能拉出选择框
        if(!$option.container.range){ console.log('yes'); throw new Error;}

        // 判断鼠标按下的时候是否在容器内
        event.path.forEach(element => {
          if(element == $element($option.container.e)){ throw new Error; } 
        });
      } catch {
        // 如果在容器内
        document.addEventListener('mousemove', mouse.move)

        mouse.start = {
          x: event.x,
          y: event.y
        }

        // 生成选框
        const selector = document.createElement('div');
        selector.setAttribute('id',$option.selector.id);
        $option.selector.class && selector.classList.add($option.selector.class);
        $style(selector,{        
          top: event.y + 'px',
          left: event.x + 'px',
          position: 'absolute',
          zIndex: $option.selector.zIndex || 99999,

          pointerEvents: 'none',
          border: '1px solid rgb(0,122,255)',
          backgroundColor: 'rgba(0,122,255,.08)'
        });
        document.body.appendChild(selector);
      }


    },

    // 鼠标抬起
    up: () => {
      // 移除 selector
      $element('#' + $option.selector.id) && $element('#' + $option.selector.id).remove();

      // 选择事件回调
      $option.selected(this.selected);

      // 销毁监听事件
      document.removeEventListener('mousemove', mouse.move)
    },

    // 鼠标平移 (按下的时候)
    move: event => {
      const _selector = $element('#' + $option.selector.id);

      const x = event.x - mouse.start.x;
      const y = event.y - mouse.start.y;
      
      const _container = $element($option.container.e);
      const c = {
        l: _container.offsetLeft,
        t: _container.offsetTop,
        r: _container.offsetLeft + _container.clientWidth,
        b: _container.offsetTop + _container.clientHeight, 
      }

      const _width = $option.container.wall ? Math.abs(
        mouse.start.x + x < c.l && mouse.start.x - c.l ||
        mouse.start.x + x > c.r && mouse.start.x - c.r ||
        x) : Math.abs(x);
      
      const _height = $option.container.wall ? Math.abs(
        mouse.start.y + y < c.t && mouse.start.y - c.t ||
        mouse.start.y + y > c.b && mouse.start.y - c.b ||
        y) : Math.abs(y);


      // 选框跟随鼠标拉动
      $style(_selector,{
        width: _width + 'px',
        height: _height + 'px',
        transform: 'translate(' + (x < 0 ? '-100%' : '0%') + ', ' + (y < 0 ? '-100%' : '0%') + ')',
      })
      
       // 选框位置计算
      mouse.area = {
        t: Math.min(mouse.start.y, event.y),
        l: Math.min(mouse.start.x, event.x),
        r: Math.max(mouse.start.x, event.x),
        b: Math.max(mouse.start.y, event.y),
      }

      this.selected = this.option.filter(e => {
                
        // 选框
        const c = mouse.area;
        // 可选元素
        const o = {
          t: e.offsetTop,
          l: e.offsetLeft,
          r: e.offsetLeft + e.clientWidth,
          b: e.offsetTop + e.clientHeight
        }

        // (元素)单边
        const t = c.t < o.t && o.t < c.b;
        const b = c.t < o.b && o.b < c.b;
        const l = c.l < o.l && o.l < c.r;
        const r = c.r > o.r && o.r > c.l;

        // 在(元素)内
        const center_x = (c.l > o.l && c.l < o.r) || (c.r < o.r && c.r > o.l);
        const center_y = (c.t > o.t && c.t < o.b) || (c.b < o.b && c.b > o.t);

        // 在(元素)外
        const inner = c.l < o.l && o.r < c.r && c.r > o.r && o.l > c.l && c.t < o.t && o.b < c.b && c.b > o.b && o.t > c.t;

        // 条件拼合
        const _if = inner || (!$option.selector.whole && ($option.selector.inner && (center_x && center_y) || (t && center_x) || (b && center_x) || (l && center_y) || (r && center_y))) ;

        _if ? e.classList.add($option.option.checked) : e.classList.remove($option.option.checked);  
        return _if ? e : false;
      })

      $option.move(this.selected);
    }

  }
  
  // 初始化
  this.mutation = () => {
    // 鼠标事件监听
    document.addEventListener('mousedown', mouse.down);
    document.addEventListener('mouseup', mouse.up);

    // 是否禁止容器可选
    !$option.container.select && ($element($option.container.e).style.userSelect = 'none');

    // 获取所有可选元素
    this.option = [].slice.call(document.querySelectorAll($option.container.e + " " + $option.option.e));
  }

  // 激活禁用插件
  this.stop = (callback = Function) =>{
    this.state = false
    document.removeEventListener('mousedown', mouse.down);
    document.removeEventListener('mouseup', mouse.up);
    mouse.up();
    callback();
  };
  this.start = (callback = Function) => {
    this.state = true
    document.addEventListener('mousedown', mouse.down);
    document.addEventListener('mouseup', mouse.up);
    callback();
  };

  // 初始化
  this.mutation();
}


