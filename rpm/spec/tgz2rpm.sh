#!/bin/bash
# This script creates an RPM from a tar file.
# $1 : tar file

SPECNAME=$(echo ${1%%-*} | sed 's/^.*\///')
NAME=%{package_name}
VERSION=$(echo ${1##*-} | sed 's/[^0-9]*$//')
RELEASE=%{build_number}
SOURCE=${SPECNAME}-${VERSION}.tar.gz
BUILDROOT=/var/tmp/${SPECNAME}-buildroot
NAMEVERSION=${SPECNAME}-${VERSION}
VENDOR="Catalogic Software Inc."
SUMMARY="Catalogic ECX User Interface" # CHANGED
LICENSE="Catalogic Software"
GROUP="Applications"
ARCH="noarch"
DESCRIPTION="
Longer
...
Description
"

######################################################
# users should not change the script below this line.#
######################################################

# This function prints the usage help and exits the program.
usage(){
    /bin/cat << USAGE

This script has been released under BSD license. Copyright (C) 2010 Reiner Rottmann <rei..rATrottmann.it>

$0 creates a simple RPM spec file from the contents of a tarball. The output may be used as starting point to create more complex RPM spec files.
The contents of the tarball should reflect the final directory structure where you want your files to be deployed. As the name and version get parsed
from the tarball filename, it has to follow the naming convention "<name>-<ver.si.on>.tar.gz". The name may only contain characters from the range
[A-Z] and [a-z]. The version string may only include numbers seperated by dots.

Usage: $0  [TARBALL]

Example:
  $ $0 sample-1.0.0.tar.gz
  
  $ /usr/bin/rpmbuild -ba /tmp/sample-1.0.0.spec 

USAGE
    exit 1    
}

if echo "${1##*/}" | sed 's/[^0-9]*$//' | /bin/grep -q  '^[a-zA-Z]\+-[0-9.]\+$'; then
   if /usr/bin/file -ib "$1" | /bin/grep -q "application/x-gzip"; then
      echo "INFO: Valid input file '$1' detected."
   else
      usage
   fi
else
    usage
fi

OUTPUT=/tmp/${SPECNAME}-${VERSION}.spec

FILES=$(/bin/tar -tzf $1 | /bin/grep -v '^.*/$' | sed 's/^/\//')

/bin/cat > $OUTPUT << EOF
%define __os_install_post %{nil}
%define debug_package %{nil}
Requires: ecx-portal-nodejs
Name: $NAME
Version: $VERSION
Release: $RELEASE
Vendor: $VENDOR
Summary: $SUMMARY
License: $LICENSE
Group: $GROUP
Source0: $SOURCE
BuildRoot: $BUILDROOT
BuildArch: $ARCH
Prefix: /opt/ECX/cdm/ui # CHANGED

%description
$DESCRIPTION

%prep

%setup -c -n ${NAMEVERSION}

%build


[ -d \${RPM_BUILD_ROOT} ] && rm -rf \${RPM_BUILD_ROOT}
/bin/mkdir -p \${RPM_BUILD_ROOT}
/bin/cp -axv \${RPM_BUILD_DIR}/${NAMEVERSION}/* \${RPM_BUILD_ROOT}/

%post

%postun

%clean

%files
%defattr(-,root,root)
$FILES

%define date    %(echo \`LC_ALL="C" date +"%a %b %d %Y"\`)


EOF

echo "INFO: Spec file has been saved as '$OUTPUT':"
echo "----------%<----------------------------------------------------------------------"
/bin/cat $OUTPUT
echo "----------%<----------------------------------------------------------------------"
