#############
# This script pulls from git main, builds, and deploys the code to Virgo.
# 
# Created by Ronald So (rso@syncsort.com)
##############################################

#!/bin/sh

PATH=/opt/ECX/virgo/bin:/opt/apache-maven-3.0.3/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/go/bin
JAVA_HOME=/usr/java/latest
GOROOT=/opt/go
CURRENT_DIR=`pwd`
STATUS="successfully"
EMAIL_LIST="rso@catalogicsoftware.com"
IP_ADDRESS=`/sbin/ifconfig eth0 | grep 'inet addr:' | cut -d: -f2 | awk '{ print $1}'`
HOST=0.0.0.0
NODE_VERSION=6.10.3
HTTPS=false

mail() {
   /bin/mail -s "Testbed machine ${IP_ADDRESS} updated ${STATUS}! ${DETAIL}" ${EMAIL_LIST} < /dev/null
}

/bin/mail -s "Updating Testbed machine ${IP_ADDRESS}." ${EMAIL_LIST} < /dev/null

export PATH
export JAVA_HOME
export GOROOT
export HOST
export HTTPS

/bin/date

echo 'Import rabbitMQ config..'
python /opt/ECX/tools/import_rabbit_conf.pyc

echo 'Kill all NodeJS processes...'
pkill node

echo 'Updating ECX 3.0 NodeJS services'
. ~/.nvm/nvm.sh
nvm use v${NODE_VERSION}
cd /home/qatesting/git/node-cdm-service
git remote prune origin
git pull --rebase
npm cache clean
rm -rf /home/qatesting/git/node-cdm-service/node_modules
npm install
node ./ecxngp.js &
echo 'Done updating ECX 3.0 NodeJS services'

echo 'Updating ECX 3.0 UI'
. ~/.nvm/nvm.sh
nvm use v${NODE_VERSION}
cd /home/qatesting/git/ng-cdm-portal
git remote prune origin
git pull --rebase

rm -rf /home/qatesting/git/ng-cdm-portal/node_modules
npm cache clean
npm install
npm install # run one more time just in case
npm start &
echo 'Done updating ECX 3.0 UI'

# echo 'Removing .m2 syncsort directory'
rm -rf /home/qatesting/.m2/repository/com/syncsort
rm -rf /home/qatesting/.m2/repository/com/catalogic

cd /home/qatesting/git/3party

git remote prune origin
git pull --rebase

cd /home/qatesting/git/guestapps

git remote prune origin
git pull --rebase

cd /home/qatesting/git/main


DETAIL="ECX `git rev-parse --abbrev-ref HEAD` Test bed machine is good to go."

git remote prune origin
git pull --rebase

./build.sh uionly
./build.sh all -DskipTests

if [ 0 -ne $? ]; then
   DETAIL="Build failed. RC=$?"
   STATUS="failed"
   mail
   exit 1
fi

/opt/virgo/bin/shutdown.sh -immediate
RC=$?
if [ 0 -ne $? ]; then
   DETAIL="Shutdown Virgo failed. RC=$?"
   STATUS="failed"
   mail
   exit 1
fi

./deploy.sh -d

RC=$?

if [ 0 -ne $RC ]; then
   DETAIL="Deploy failed. RC=$RC"
   STATUS="failed"
   mail
   exit 1
fi

mail
exit 0

