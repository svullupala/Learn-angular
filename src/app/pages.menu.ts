export const PAGES_MENU = [
  {
    path: 'pages',
    children: [
      {
        path: 'dashboard',
        data: {
          menu: {
            title: 'menubar.textDashboard',
            icon: 'bidi-dashboard_24'
          }
        },
        rbacPath: 'root:0/screen:0/screen:9'
      },
      {
        path: 'jobsandoperations',
        data: {
          menu: {
            title: 'menubar.textJobsAndOperations',
            icon: 'bidi-jobsAndOperations_24'
          }
        }
      },
      {
        path: 'manageprotection',
        data: {
          menu: {
            title: 'menubar.textManageProtection',
            icon: 'bidi-manageProtection_24'
          }
        },
        children: [
          {
            path: 'policyoverview',
            data: {
              menu: {
                title: 'menubar.submenu.textPolicyOverview'
              }
            },
            rbacPath: 'root:0/screen:0/screen:13'
          },
          {
            path: 'filerestore',
            data: {
              menu: {
                title: 'menubar.submenu.textFileRestore'
              }
            },
            rbacPath: 'root:0/screen:0/screen:10'
          },
          {
            path: 'manage-hypervisors',
            data: {
              menu: {
                title: 'menubar.submenu.textManageHypervisors',
              }
            },
            rbacPath: 'root:0/screen:0/screen:100'
          },
         {
           path: 'manage-applications',
           data: {
             menu: {
               title: 'menubar.submenu.textManageApplications',
             }
           },
           rbacPath: 'root:0/screen:0/screen:230'
         },
          {
            path: 'virtsystems',
            data: {
              menu: {
                title: 'menubar.submenu.textVirtSystems'
              }
            },
            children: [
              {
                path: 'vmware',
                data: {
                  menu: {
                    title: 'menubar.submenu.textVMware',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:100'
              },
              {
                path: 'hyperv',
                data: {
                  menu: {
                    title: 'menubar.submenu.textHyperv',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:110'
              },
              {
                path: 'awsec2',
                data: {
                  menu: {
                    title: 'menubar.submenu.textAWSEC2',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:120'
              }
            ]
          },
          {
            path: 'containers',
            data: {
              menu: {
                title: 'menubar.submenu.textContainers'
              }
            },
            children: [
              // {
              //   path: 'redhat',
              //   data: {
              //     menu: {
              //       title: 'Red Hat Openshift',
              //     }
              //   },
              //   rbacPath: 'root:0/screen:0/screen:240'
              // },
              // {
              //   path: 'docker',
              //   data: {
              //     menu: {
              //       title: 'Docker,
              //     }
              //   },
              //   rbacPath: 'root:0/screen:0/screen:200'
              // },
              {
                path: 'k8s',
                data: {
                  menu: {
                    title: 'menubar.submenu.textKubernetes',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:260'
              }
            ]
          },
          {
            path: 'cloud',
            data: {
              menu: {
                title: 'menubar.submenu.textCloudManagement'
              }
            },
            children: [
              {
                path: 'office365',
                data: {
                  menu: {
                    title: 'menubar.submenu.textExchangeOnline',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:250'
              }
            ]
          },
          {
            path: 'databases',
            data: {
              menu: {
                title: 'menubar.submenu.textDatabases'
              }
            },
            children: [
              {
                path: 'db2',
                data: {
                  menu: {
                    title: 'menubar.submenu.textDB2',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:230'
              },
              {
                path: 'exch',
                data: {
                  menu: {
                    title: 'menubar.submenu.textExchange',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:220'
              },
              {
                path: 'mongo',
                data: {
                  menu: {
                    title: 'menubar.submenu.textMongoDb',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:240'
              },
              {
                path: 'oracle',
                data: {
                  menu: {
                    title: 'menubar.submenu.textOracle',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:200'
              },
              {
                path: 'sql',
                data: {
                  menu: {
                    title: 'menubar.submenu.textSQL'
                  }
                },
                rbacPath: 'root:0/screen:0/screen:210'
              }
            ]
          },
          {
          path: 'spectrum',
            data: {
              menu: {
                title: 'menubar.submenu.textSPP'
              }
            },
          children: [
          {
            path: 'backup',
            data: {
              menu: {
                title: 'menubar.submenu.textBackup'
              },
            },
            rbacPath: 'root:0/screen:0/screen:19'
          },
          {
            path: 'restore',
            data: {
              menu: {
                title: 'menubar.submenu.textRestore'
              }
            },
            rbacPath: 'root:0/screen:0/screen:20'
          },
          {
            path: 'manage',
            data: {
              menu: {
                title: 'menubar.submenu.textRecoveryPointRetention'
              },
            },
            rbacPath: 'root:0/screen:0/screen:21'
          }]
          }
        ]
      },
      {
        path: 'systemconfiguration',
        data: {
          menu: {
            title: 'menubar.textSystemConfiguration',
            icon: 'bidi-systemConfiguration_24'
          }
        },
        children: [
          {
            path: 'backupstorage',
            data: {
              menu: {
                title: 'menubar.submenu.textBackupStorage',
              }
            },
            rbacPath: 'root:0/screen:0/screen:14',
            children: [
              {
                path: 'disk',
                data: {
                  menu: {
                    title: 'menubar.submenu.textDisk',
                  }
                },
                rbacPath: 'root:0/screen:0/screen:14',
              },
              {
                path: 'cloud',
                data: {
                  menu: {
                    title: 'menubar.submenu.textCloud'
                  }
                },
                rbacPath: 'root:0/screen:0/screen:14',
              },
              {
                path: 'repository',
                data: {
                  menu: {
                    title: 'menubar.submenu.textRepositoryServer'
                  }
                },
                rbacPath: 'root:0/screen:0/screen:14',
              }
            ]
          },
          {
            path: 'vadpproxymonitor',
            data: {
              menu: {
                title: 'menubar.submenu.textVADPProxy'
              }
            },
            rbacPath: 'root:0/screen:0/screen:22'
          },
          {
            path: 'site',
            data: {
              menu: {
                title: 'menubar.submenu.textSite'
              }
            },
            rbacPath: 'root:0/screen:0/screen:23'
          },
          {
            path: 'ldapsmtp',
            data: {
              menu: {
                title: 'menubar.submenu.textLdapSmtp'
              }
            },
            rbacPath: 'root:0/screen:0/screen:24'
          },
          {
            path: 'scripts',
            data: {
              menu: {
                title: 'menubar.submenu.textScript'
              }
            },
            rbacPath: 'root:0/screen:0/screen:18'
          },
          {
            path: 'keysandcertificates',
            data: {
              menu: {
                title: 'menubar.submenu.textKeysAndCertificates'
              }
            },
            rbacPath: 'root:0/screen:0/screen:31'
          },
          {
            path: 'globalpreferences',
            data: {
              menu: {
                title: 'global-preferences.textGlobalPreferences'
              }
            },
            rbacPath: 'root:0/screen:0/screen:300'
          }
        ]
      },
      {
        path: 'reportsandlogs',
        data: {
          menu: {
            title: 'menubar.textReportsAndLogs',
            icon: 'bidi-report_24'
          }
        },
        children: [
          {
            path: 'reports',
            data: {
              menu: {
                title: 'menubar.submenu.textReports'
              }
            },
            rbacPath: 'root:0/screen:0/screen:5'
          },
          {
            path: 'auditlog',
            data: {
              menu: {
                title: 'menubar.submenu.textAuditLog'
              }
            },
            rbacPath: 'root:0/screen:0/screen:26'
          }
        ]
      },
      {
        path: 'accounts',
        data: {
          menu: {
            title: 'menubar.textAccounts',
            icon: 'bidi-accounts_24'
          }
        },
        children: [
          {
            path: 'users',
            data: {
              menu: {
                title: 'menubar.submenu.textUser'
              }
            },
            rbacPath: 'root:0/screen:0/screen:27'
          },
          {
            path: 'roles',
            data: {
              menu: {
                title: 'menubar.submenu.textRole'
              }
            },
            rbacPath: 'root:0/screen:0/screen:28'
          },
          {
            path: 'resourcegroups',
            data: {
              menu: {
                title: 'menubar.submenu.textResourceGroup'
              }
            },
            rbacPath: 'root:0/screen:0/screen:29'
          },
          {
            path: 'identities',
            data: {
              menu: {
                title: 'menubar.submenu.textIdentity'
              }
            },
            rbacPath: 'root:0/screen:0/screen:30'
          },
        ]
      }
    ]
  }
];
