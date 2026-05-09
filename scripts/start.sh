export NODE_ENV=production
node -v
npm  -v
echo $NODE_ENV
node ../src/app.js > logs.txt &
PID=$!
echo "PID = $PID"
echo "PID > node.pid"
echo "Writing logs into `pwd`/logs.txt"
