#!/bin/bash

#####################################################################################
# Builds cdmui rpm which delivers ECX UI (ECX User Interface)
#
# Options:
#	No Options: Builds UI, and RPM
#	-v: Set RPM package version
#	-b: Set RPM build version
#
# Example Invocation:
#       ./build.sh               ( builds all )
#       ./build.sh ui|rpm        ( builds ui or rpm )
#	./build.sh -v 3.0.0 -b 1 (builds ecx-ui as default which is the CATALOGIC version)
#	./build.sh -v 3.0.0 -b 1 -o CATALOGIC (builds ecx-ui CATALOGIC version)
#	./build.sh -v 3.0.0 -b 1 -o IBM (builds ecx-ui IBM version) // WARNING: NOT SUPPORTED FOR NOW
#	./build.sh (builds using default RPM package and build version and CATALOGIC version)
#
# RPM Location: distribution directory
#
#####################################################################################


##################################################
#Increment this version number as and when necessary
#Used for RPM
##################################################
RPM_PACKAGE_VERSION=1.0.0

##################################################
#Increment this build number as and when necessary
#Used for RPM
##################################################
RPM_BUILD_NUMBER=1

RPM_STAGING="staging"
RPM_PACKAGE_NAME=${RPM_PACKAGE_NAME:=cdmui}
RPMBUILDAREA=~/rpmbuild

TAR_PACKAGE_NAME_PREFIX="cdmui"

CWD=`pwd`
DISTRIBUTION_DIR="distrpm"
PRODUCT_NAME="CDM-UI"

JAR_FILE_PREFIX="cdmui"

UI_SRCDIR="."
UI_DISTDIR="dist"
BUILD_UI="npm run build:prod"
INSTALL_UI="npm install"
EXPORT_NODE_OPTIONS="export NODE_OPTIONS=--max_old_space_size=4096"

SPEC_DIR="rpm/spec"


######
# OEM
######
CATALOGIC="CATALOGIC"
IBM="IBM"

# OEM_CONFIG_FILE="emi.config.json"
# OEM_SOURCE_DIR="${CWD}/UI/com.catalogic.ms.adminconsole.plugin.emi/oem"
# OEM_TARGET_DIR="${CWD}/UI/com.catalogic.ms.adminconsole.plugin.emi/plugins/emi/"

########################
#increment count pointer
########################
incrptr() {
  counter=`expr $counter + 1`
}

########################
#Step printer
########################
stpprinter() {
  incrptr
  msgprint=$1
  echo ""
  echo ""
  echo -ne " ${counter}. ${msgprint}..."
  echo ""
}

#########################################################
# inspect return code and return error if necessary
# ARG1 = Return code
# ARG2 = log file - File name path of the output for logs
#########################################################
inspect_rc() {
  RC=$1
  if [ $RC -eq 0 ]; then
    echo ""
    echo "	done."
  else
    echo ""
    echo "	Error encountered.  RC=$RC"		
    exit $RC
  fi
}

###############
# Build UI
###############
build_ui() {
  echo ""

  cd ${UI_SRCDIR}

  echo "(Current Working Directory is ${PWD})"

  echo "Running npm install"
  ${INSTALL_UI}
  inspect_rc $?

  echo "exporting NODE_OPTIONS"
  ${EXPORT_NODE_OPTIONS}
  inspect_rc $?

  ${BUILD_UI}
  inspect_rc $?

  cd ${CWD}
}

#########
# Cleanup
#########
cleanup() {
  echo ""

  # Clean up UI_DIST dir
  if [ -d ${UI_DISTDIR} ]; then
    echo "      Deleting ${UI_DISTDIR}"
    rm -rf ${UI_DISTDIR}
    inspect_rc $?
  fi
  
  if [ -d ${RPM_STAGING} ]; then
    echo "	Deleting ${RPM_STAGING}"
    rm -rf ${RPM_STAGING}
    inspect_rc $?
  fi
  
  echo "	Deleting compiled scripts"
  rm -rf scripts/*.pyc
  inspect_rc $?
  
  if [ -f /tmp/${RPM_SPEC_FILENAME} ]; then
    echo "	Deleting /tmp/${RPM_SPEC_FILENAME}"
    rm -rf /tmp/${RPM_SPEC_FILENAME}
    inspect_rc $?
  fi

  if [ -f ${TAR_PACKAGE_NAME} ]; then
    echo "	Deleting ${TAR_PACKAGE_NAME}"
    rm -rf ${TAR_PACKAGE_NAME}
    inspect_rc $?
  fi
}

#########
# Cleanup
#########
failed_exit() {
  cleanup
  inspect_rc 1
}

##########
# Show Env
##########
showenv() {
	echo ""
	echo ""  
	echo "Current Working Directory: ${CWD}"
	echo "RPM_PACKAGE_VERSION: ${RPM_PACKAGE_VERSION}"
	echo "RPM_BUILD_NUMBER: ${RPM_BUILD_NUMBER}"
	echo "RPM_SPEC_FILENAME: ${RPM_SPEC_FILENAME}"
	echo "TAR_PACKAGE_NAME: ${TAR_PACKAGE_NAME}"
	echo ""
	echo ""
}

##############
# Setup Build
##############
setup() {  
  echo ""

  if [ -d ${DISTRIBUTION_DIR} ]; then
    stpprinter "${DISTRIBUTION_DIR} found, cleaning it"
    rm -rf ${DISTRIBUTION_DIR}
    inspect_rc $?
  fi

  # Create directories for rpmbuild if needed.
  if [  -d ${RPMBUILDAREA}/BUILD ]; then
    stpprinter "${RPMBUILDAREA}/BUILD found, cleanup"
    rm -rf ${RPMBUILDAREA}/BUILD/${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}
  else
    stpprinter "${RPMBUILDAREA}/BUILD not found, creating it"
    mkdir -p ${RPMBUILDAREA}/BUILD
    inspect_rc $?
  fi

  if [ -d ${RPMBUILDAREA}/BUILDROOT ]; then
    stpprinter "${RPMBUILDAREA}/BUILDROOT found, cleanup"
    rm -rf ${RPMBUILDAREA}/BUILDROOT/${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}*
  else
    stpprinter "${RPMBUILDAREA}/BUILDROOT not found, creating it"
    mkdir -p ${RPMBUILDAREA}/BUILDROOT
    inspect_rc $?
  fi

  if [ -d ${RPMBUILDAREA}/RPMS ]; then
    stpprinter "${RPMBUILDAREA}/RPMS found, cleanup"
    rm -rf ${RPMBUILDAREA}/RPMS/noarch/${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}*.rpm
  else
    stpprinter "${RPMBUILDAREA}/RPMS not found, creating it"
    mkdir -p ${RPMBUILDAREA}/RPMS
    inspect_rc $?
  fi

  if [ -d ${RPMBUILDAREA}/SOURCES ]; then
    stpprinter "${RPMBUILDAREA}/SOURCES found, cleanup"
    rm -rf ${RPMBUILDAREA}/SOURCES/${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}.tar.gz
  else
    stpprinter "${RPMBUILDAREA}/SOURCES not found, creating it"
    mkdir -p ${RPMBUILDAREA}/SOURCES
    inspect_rc $?
  fi

  if [ -d ${RPMBUILDAREA}/SPECS ]; then
    stpprinter "${RPMBUILDAREA}/SPECS found, cleanup"
    rm -rf ${RPMBUILDAREA}/SPECS/${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}.spec
  else
    stpprinter "${RPMBUILDAREA}/SPECS not found, creating it"
    mkdir -p ${RPMBUILDAREA}/SPECS
    inspect_rc $?
  fi

  if [ -d ${RPMBUILDAREA}/SRPMS ]; then
    stpprinter "${RPMBUILDAREA}/SRPMS found, cleanup"
    rm -rf ${RPMBUILDAREA}/SRPMS/${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}*.rpm
  else
    stpprinter "${RPMBUILDAREA}/SRPMS not found, creating it"
    mkdir -p ${RPMBUILDAREA}/SRPMS
    inspect_rc $?
  fi



  TAR_PACKAGE_NAME=${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}.tar.gz
  RPM_SPEC_FILENAME=${TAR_PACKAGE_NAME_PREFIX}-${RPM_PACKAGE_VERSION}.spec
  
  stpprinter "Creating ${DISTRIBUTION_DIR}"
  mkdir -p ${DISTRIBUTION_DIR}
  inspect_rc $?

#  stpprinter "Running OEM related changes"
#  if [ -z ${OEM} ]; then
#	echo "	No OEM specifed. Running default mode"
#
#	oem ${CATALOGIC}
#  else
#	echo "	${OEM} mode specified"
#	if [ ${OEM} == ${CATALOGIC} ]; then
#		echo "	${OEM}. Running default mode"
#		oem ${CATALOGIC} 
#	elif [ ${OEM} == ${IBM} ]; then
#		oem ${IBM}
#	fi	
#  fi
}

##############
# Setup Build
##############
oem() {
	if [ -d ${OEM_SOURCE_DIR}/${1} ]; then
		if [ -f ${OEM_SOURCE_DIR}/${1}/${OEM_CONFIG_FILE} ]; then
			echo "	Copying ${OEM_SOURCE_DIR}/${1}/${OEM_CONFIG_FILE} to ${OEM_TARGET_DIR}"
			cp -pr ${OEM_SOURCE_DIR}/${1}/${OEM_CONFIG_FILE} ${OEM_TARGET_DIR}
			inspect_rc $?
		else
			echo "	${OEM_SOURCE_DIR}/${1}/${OEM_CONFIG_FILE} NOT found."
			failed_exit
		fi
	else
		echo "	${OEM_SOURCE_DIR}/${1} NOT found."
		failed_exit
	fi
}


##########################
# Creates RPM staging area
##########################
create_rpm_staging(){
  echo ""
  echo "	Creating directory layout  ${RPM_STAGING}/opt/ECX/spp"
  mkdir -p ${RPM_STAGING}/opt/ECX/spp
  inspect_rc $?
  echo "        Creating directory layout  ${RPM_STAGING}/opt/ECX/spp/public"
  mkdir -p ${RPM_STAGING}/opt/ECX/spp/public
  inspect_rc $?

  echo "	Copying UI"
  cp -pr ${UI_SRCDIR}/${UI_DISTDIR}/* ${RPM_STAGING}/opt/ECX/spp/public
}

###############################
# Creates tar ball for RPM SPEC
##############################
create_tarball(){
  echo "	Creating ${TAR_PACKAGE_NAME} "
  
  tar -C ${RPM_STAGING} -czf ${TAR_PACKAGE_NAME} .
  inspect_rc $?

  if [ -f ${TAR_PACKAGE_NAME} ]; then 
    echo "      ${TAR_PACKAGE_NAME} exists"
  else
    echo "      ${TAR_PACKAGE_NAME} does NOT exist"
    failed_exit
  fi
}

###############################
# Creates RPM SPEC file
##############################
create_spec_file(){
  echo "	Creating RPM SPEC File"
  
  echo "	Creating RPM spec of ${TAR_PACKAGE_NAME} file..."
  if [ -f ${SPEC_DIR}/tgz2rpm.sh ]; then
    ${SPEC_DIR}/tgz2rpm.sh ${TAR_PACKAGE_NAME}
    inspect_rc $?
  else
    echo "    ${SPEC_DIR}/tgz2rpm.sh missing. ERROR!"
    failed_exit
  fi
}

#############
# Creates RPM
#############
create_rpm(){  
  echo "	Copying sources to RPM build area"
  cp -pr ${TAR_PACKAGE_NAME} ${RPMBUILDAREA}/SOURCES
  inspect_rc $?
  
  echo "	Copying RPM spec file to RPM build area"
  cp -pr /tmp/${RPM_SPEC_FILENAME} ${RPMBUILDAREA}/SPECS
  inspect_rc $?
  
  echo ""
  echo ""
  echo "	Building application RPM"
  rpmbuild -ba ${RPMBUILDAREA}/SPECS/${RPM_SPEC_FILENAME} "--define=build_number ${RPM_BUILD_NUMBER}" "--define=distribution_dir ${CWD}/${DISTRIBUTION_DIR}" "--define=package_name ${RPM_PACKAGE_NAME}"
  inspect_rc $?
  echo ""
  echo ""
  
  echo "	Copy application RPM to distribution area"  
  ECXADMIN_RPM=$(ls -1t ${RPMBUILDAREA}/RPMS/noarch | head -1)
  inspect_rc $?  

  echo "	Copying ${ECXADMIN_RPM} to ${DISTRIBUTION_DIR}"
  cp -pr ${RPMBUILDAREA}/RPMS/noarch/${ECXADMIN_RPM} ${DISTRIBUTION_DIR}
  inspect_rc $?

}

###################
# Build Package RPM
###################
build_rpm() {
  create_rpm_staging
  create_tarball
  create_spec_file
  create_rpm     
}

###########################################
# This is where the script starts
###########################################
echo ""
echo "Starting ${PRODUCT_NAME} build"
echo ""

while getopts ":v:b:o:" opt; do
  case $opt in
    v)
      stpprinter "Setting RPM_PACKAGE_VERSION"
      RPM_PACKAGE_VERSION=$OPTARG
      inspect_rc $?      
      ;;
    b)
      stpprinter "Setting RPM_BUILD_NUMBER"
      RPM_BUILD_NUMBER=$OPTARG
      inspect_rc $?
      ;;
    o)
      stpprinter "Setting OEM INFORMATION"
      OEM=$OPTARG
      inspect_rc $?
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      failed_exit
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      failed_exit
      ;;
  esac
done
shift $((OPTIND-1))

if [ "$1" == "" -o "$1" == "ui" ]; then
    stpprinter "Running Cleanup"
    cleanup

    stpprinter "Running Setup"
    setup

    stpprinter "Build Environment:"
    showenv

    stpprinter "Building UI"
    if [ -d ${UI_SRCDIR} ]; then
	build_ui
	echo ""
    else
	echo "${UI_SRCDIR} directory NOT found"
	inspect_rc 1
    fi

    if [ -f /.dockerinit -o -f /.dockerenv ]; then
	useradd  -M -r -g users  builder > /dev/null 2>&1
	chown -R builder:users dist distrpm  node_modules
    fi
fi

if [  "$1" == "" -o "$1" == "rpm"  ]; then
    setup
    stpprinter "Building RPM"
    build_rpm

    stpprinter "Running Cleanup"
    cleanup

    if [ -f /.dockerinit -o -f /.dockerenv ]; then
	useradd  -M -r -g users  builder > /dev/null 2>&1
	chown -R builder:users distrpm
    fi

    echo ""
    echo "Build Done. Please pick up ${ECXADMIN_RPM} from ${DISTRIBUTION_DIR} directory"
    echo ""
fi
