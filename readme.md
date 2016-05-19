#A simple shopping server with nodejs <br/>一元购的nodejs服务端

##安装
1. 安装[nodejs](https://nodejs.org/en/download/)
2. 在工作目录输入npm install安装插件
3. 安装[mongoddb](https://www.mongodb.com/download-center)

##运行
1. 启动数据库 (Mac在终端输入: mongod --config /usr/local/etc/mongod.conf)
2. npm start或者 pm2 start startserver.json

##项目结构:
* actions: 执行
* routes：路由分发
* constants：常量定义
* public：静态文件，js库、css文件、图片
* tools：自定义的工具
* view：界面
* app.js：项目入口
* project.json：项目配置

##html后台
###商品相关
+ [添加商品](http://localhost:8000/product/add)
+ [编辑商品](http://localhost:8000/product/edit?gid=xx)
+ [商品列表](http://localhost:8000/product/list)

###用户相关
+ [用户注册](http://localhost:8000/user/signup)
+ [用户登陆](http://localhost:8000/user/signin)

###商品期数相关
+ [期数列表](http://localhost:8000/period/list)

###购买相关
+ [购买记录](http://localhost:8000/record/list)

###充值
*需要登陆*
+ [充值](http://localhost:8000/charge/main)
+ [充值记录](http://localhost:8000/charge/list)

###购买
+ 待做

##API:
示例: http://localhost:8000/api/jsonData?*action=get\_goods*&*current\_page=0*&*query\_state=1*
+ intro: 获取商品期数列表 
+ action: get\_goods 
+ params: current\_page:页数 query_state:状态




