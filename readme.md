A simple shopping server with nodejs

介绍：
一元购的nodejs服务端

安装：
1、安装nodejs
2、在工作目录输入npm install安装插件
3、安装mongod db

运行:
npm start
或者 pm2 start startserver.json

启动数据库
mongod --config /usr/local/etc/mongod.conf

html后台:
添加商品 http://localhost:8000/product/add
编辑商品 http://localhost:8000/product/edit?gid=xx
商品列表 http://localhost:8000/product/list

API:
获取商品期数列表 current_page：页数 query_state：商品状态
http://localhost:8000/api/jsonData?action=get_goods&current_page=0&query_state=1

项目结构:
actions: 执行
routes：路由分发
constants：常量定义
public：静态文件，js库、css文件、图片
tools：自定义的工具
view：界面
app.js：项目入口
project.json：项目配置

