#!/usr/bin/env bash

set -e

cd $TRAVIS_BUILD_DIR
./tools/travis/scancode.sh
export PATH=$PATH:$TRAVIS_BUILD_DIR

HOMEDIR="$(dirname "$TRAVIS_BUILD_DIR")"
cd $HOMEDIR

# OpenWhisk clone to fixed directory location
git clone --depth 3 https://github.com/apache/incubator-openwhisk.git openwhisk

# Build script for Travis-CI.
WHISKDIR="$HOMEDIR/openwhisk"

cd $WHISKDIR
./tools/travis/setup.sh

ANSIBLE_CMD="ansible-playbook -i environments/local -e docker_image_prefix=openwhisk"

cd $WHISKDIR/ansible
$ANSIBLE_CMD setup.yml
$ANSIBLE_CMD prereq.yml
$ANSIBLE_CMD couchdb.yml
$ANSIBLE_CMD initdb.yml

$ANSIBLE_CMD wipe.yml
$ANSIBLE_CMD openwhisk.yml -e '{"openwhisk_cli":{"installation_mode":"remote","remote":{"name":"OpenWhisk_CLI","dest_name":"OpenWhisk_CLI","location":"https://github.com/apache/incubator-openwhisk-cli/releases/download/latest"}}}'


export OPENWHISK_HOME="$(dirname "$TRAVIS_BUILD_DIR")/openwhisk"

WHISKPROPS_FILE="$OPENWHISK_HOME/whisk.properties"

WSK_CLI=$OPENWHISK_HOME/bin/wsk
AUTH_KEY=$(cat $OPENWHISK_HOME/ansible/files/auth.whisk.system)
EDGE_HOST=$(grep '^edge.host=' $WHISKPROPS_FILE | cut -d'=' -f2)

# Install the package
cd $TRAVIS_BUILD_DIR
source install.sh $EDGE_HOST $AUTH_KEY $WSK_CLI

mkdir $OPENWHISK_HOME/tests/src/test/scala/rss
cp tests/src/* $OPENWHISK_HOME/tests/src/test/scala/rss/

cd $OPENWHISK_HOME
X="./gradlew :tests:test --tests rss.RSSTests "
# for f in $(ls $OPENWHISK_HOME/tests/src/test/scala | sed -e 's/\..*$//'); do X="$X --tests \"rss.$f\""; done
eval $X
