/*
START--master process
*/
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const mast_process_container={};//dimension:request pathname
const mast_process_global={
  pv:0,
  uv:0
};
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  };
  setInterval(function(){
    console.log("\n\nnewest log (at: "+Date()+")");
    for(var pn in mast_process_container){
      console.log("request url:"+pn+";request num:"+mast_process_container[pn].reqNum);
    }
  },10000);
  //events on webserver process
  cluster.on('message',function(worker,msg,handle){
    console.log(msg);
    var pathname = msg.pathname.substring(1);
    if(mast_process_container[pathname]){
      mast_process_container[pathname].reqNum += 1;
    }else{
      mast_process_container[pathname] = {
        reqNum:1
      }
    }
  })
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
/*
END--master process
*/
} else {
  /*
  START--webserver process
  */
  const http = require('http');
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    var headers = req.headers,
        connection = req.connection,
        socket = req.remoteAddress;

    var ua = headers['user-agent'];
    var ip = headers['x-forwarded-for'] || 
     connection.remoteAddress || 
     socket.remoteAddress ||
     connection.socket.remoteAddress;
    process.send({
      browser:ua.indexOf('Edge')>-1?"Edge":"Chrome",
      ip:ip,
      pathname:req.url.replace(/\?.*/g,'')
    });
    res.writeHead(200);
    res.end('hello world\nprocess id '+process.pid);
  }).listen(8000);
  /*
  END--webserver process
  */
}