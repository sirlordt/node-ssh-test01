const fs = require('fs')
const path = require('path')
const {NodeSSH} = require('node-ssh');
const dayjs = require('dayjs')
const readline = require('readline');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   

async function main() {

  //const today = new Date();

  const _DATE_TIME_FORMAT_01 = "YYYY-MM-DDTHH-mm-ss-SSS[Z]Z";
  const _DATE_TIME_FORMAT_02 = "YYYY-MM-DDTHH:mm:ss.SSS";

  const strFileName = "output-" + dayjs().format( _DATE_TIME_FORMAT_01 ) + ".txt";
  const strFileNameRaw = "output-" + dayjs().format( _DATE_TIME_FORMAT_01 ) + ".raw.txt";
    
  fs.writeFileSync( strFileName, "" );

  /*
  const strScript = "cd /home/sirlordt/Desktop/Node_JS/cli-progress-test01\n" + 
                    "ls -l\n" +
                    "npm install\n" +
                    "exit\n";
  */

  const ssh = new NodeSSH();

  const strUserName = "sirlordt";
  const strHost = "horus";

  await ssh.connect( {
                       host: "localhost",
                       username: strUserName,
                       password: "rafael"
                       //privateKey: '/home/steel/.ssh/id_rsa'
                     });

  const remoteShell = await ssh.requestShell( 
                                             { 
                                               rows: 24,
                                               cols: 80,
                                               height: 480,
                                               width: 640,
                                               term: "vt100",
                                             },
                                            );

  remoteShell.on( "close", () => {
    
    //console.log( "Stream::close" );
    ssh.dispose(); //Close the connection

  });

  //let commands = [];

  let intShellPromt = 0;

  let strCurrentCommand = "";

  let strShellPromt = "";

  let oldNow = null;

  const processData =  async ( data ) => {

    try {

      const strOutput = data.toString( "utf8" ); 

      //console.log( strOutput );
      process.stdout.write( strOutput );

      fs.appendFile( strFileNameRaw, strOutput, ( error ) => {} );

      const bCarrierReturn = strOutput.includes( "\r" );

      const outputLines = strOutput.split( "\r" );

      for ( let intIndexLine = 0; intIndexLine < outputLines.length; intIndexLine++ ) {

        const now = dayjs();

        let intDiffMS = 0;

        if ( oldNow ) {

          intDiffMS = now.diff( oldNow )

        }
 
        //.replace(/[\n\r]+/g, '')
        let strLine = outputLines[ intIndexLine ].replace( "\n", "[@__LF__@]" ).trim();

        //const bLineFeed = strLine.endsWith( "[@__LF__@]" ); //.includes( "\n" );

        let strLineEnd = ""; //

        //if ( bCarrierReturn ) { //&& bLineFeed 

          //strLineEnd = "[@__CR__@][@__LF__@]";

        //}
        //else 
        if ( bCarrierReturn ) {

          strLineEnd = "[@__CR__@]";

        }
        //else if ( bLineFeed ) {

          //strLineEnd = "[@__LF__@]";

        //}

        strLine = strLine + strLineEnd;
        
        if ( strLine.startsWith( `${strUserName}@${strHost}:` ) &&
             strLine.endsWith( `$` ) ) {

          intShellPromt = 1;

          strShellPromt = strLine;

          //fs.appendFileSync( strFileName, today.toISOString() + " => 0 => " + strShellPromt + "\r" );
          
        }
        else if ( intShellPromt === 2 ) {

          ///fs.appendFileSync( strFileName, "[+" + intDiffMS + "ms] => " + now.format( _DATE_TIME_FORMAT_02 ) + " => 1 => " + strShellPromt + " " + strLine + "\r" );
          fs.appendFile( strFileName, "[+" + intDiffMS + "ms] => " + now.format( _DATE_TIME_FORMAT_02 ) + " => 1 => " + strShellPromt + " " + strLine + "\r", () => {} );

          intShellPromt += 1;

          //console.log( strShellPromt + " " + strLine );

        }
        else if ( intShellPromt > 3 || strLine ) {

          //if ( strLine !== "[@__CR__@]" ) {

          ///fs.appendFileSync( strFileName, "[+" + intDiffMS + "ms] => " + now.format( _DATE_TIME_FORMAT_02 ) + " => 2 => " + strLine + "\r" );
          fs.appendFile( strFileName, "[+" + intDiffMS + "ms] => " + now.format( _DATE_TIME_FORMAT_02 ) + " => 2 => " + strLine + "\r", () => {} );

          //}
          //console.log( strLine );

        }

        oldNow = now;

      }

    }
    catch ( error ) {

      console.error( error );
 

    }

  }

  remoteShell.on( "data", ( data ) => {

    processData( data );

  });

  let commands = [ "ls -l\n",
                   "mkdir -p /home/sirlordt/Desktop/git_clone\n",
                   "cd /home/sirlordt/Desktop/git_clone\n",
                   "rm -f clone_test01.sh\n",
                   "touch clone_test01.sh\n",
                   //`echo "#!/bin/bash" > clone_test01.sh\n`,
                   //`echo "\\n" >> clone_test01.sh\n`,
                   `echo "hello world" >> clone_test01.sh\n`,
                   "chmod +x clone_test01.sh\n",
                   "./clone_test01.sh\n",
                   "exit\n" ];

  /*
  let commands = [ "ls -l\n",
                   "mkdir /home/sirlordt/Desktop/git_clone\n",
                   "cd /home/sirlordt/Desktop/git_clone\n",
                   "git clone https://github.com/dotnet/runtime.git\n",
                   "rm -fr runtime\n",
                   "exit\n" ];
  */

  /*
  let commands = [ "ls -l\n",
                   "cd /home/sirlordt/Desktop/Node_JS/cli-progress-test01\n",
                   "npm install\n",
                   "npm start\n",
                   "rm -fr node_modules\n",
                   "rm -f package-lock.json\n",
                   "exit\n" ]; 
  */

  //let handlerInterval = null;

  let intWaitShellPromtCount = 1;

  while ( intShellPromt === 0 ) {

    console.log( "[" + intWaitShellPromtCount + "] Wainting for shell promt..." );

    intWaitShellPromtCount += 1;

    await sleep( 1000 );

  };

  //await sleep( 5000 );

  let intIndexCommand = 0;

  //for ( let intIndexCommand = 0; intIndexCommand < commands.length; intIndexCommand++ ) {
  while ( intIndexCommand < commands.length ) {

    if ( intShellPromt === 1 ) {

      intShellPromt += 1;

      strCurrentCommand = commands[ intIndexCommand ];
     
      if ( intIndexCommand + 1 < commands.length ) {

        //console.log( "Executing remote ssh command: " + strCurrentCommand );
        
        remoteShell.write( strCurrentCommand );

      }
      else {

        //console.log( "Executing last remote ssh command: " + strCurrentCommand );

        remoteShell.end( strCurrentCommand );
        
      }

      intIndexCommand += 1;
     
    }
    else {

      await sleep( 1000 );

    }

    /*
    await new Promise( ( resolve, reject ) => {
    
      intShellPromt = 0;

      strCurrentCommand = commands[ intIndexCommand ];

      if ( intIndexCommand + 1 < commands.length ) {
      
        remoteShell.write( strCurrentCommand );

      }
      else {

        remoteShell.end( strCurrentCommand );
        
        resolve( true );

      }

      handlerInterval = setInterval( () => {

        if ( intShellPromt === 1 ) {

          resolve( true );

        }

      }, 3000 );

    });

    if ( handlerInterval ) {

      clearInterval( handlerInterval )

    }
    */

  }


  //console.log( "1" );

  //remoteShell.write( commands[ commands.length - 1 ] + "\r" );

  //console.log( "2" );

  //remoteShell.write( commands[ commands.length - 1 ] + "\r" );

  //console.log( "3" );
  
  //remoteShell.end( commands[ commands.length - 1 ] + "\r" );

  //console.log( "4" );

  /*
  ssh.exec( 
            "/home/sirlordt/.nvm/versions/node/v14.16.1/bin/npm",
            [ "start" ], 
            { 
              cwd: "/home/sirlordt/Desktop/Node_JS/cli-progress-test01",
              stream: 'stdout', 
              options: { 
                         pty: true,
                         //cols: 20
                       },
              onStdout(chunk) {
                     
                console.log( chunk.toString('utf8'))
              
              },
              onStderr(chunk) {
                
                //console.log('stderrChunk', chunk ); //.toString('utf8'))
      
              },
            }
          );
  */

  //await 
  /*
  ssh.exec( 
            "ls",
            [ "-l", "-h" ], 
            { 
              cwd: "/home/sirlordt",
              stream: 'stdout', 
              //options: { 
              //           pty: true,
              //           cols: 20
              //         },
              onStdout(chunk) {
                     
                console.log('stdoutChunk', chunk.toString('utf8'))
              
              },
              onStderr(chunk) {
                
                console.log('stderrChunk', chunk.toString('utf8'))
      
              },
            }
          ); //.then(function(result) {
    */
    
    //console.log( "STDOUT: "  + result );
  
  //})

  
/*
 Or
 ssh.connect({
   host: 'localhost',
   username: 'steel',
   privateKey: fs.readFileSync('/home/steel/.ssh/id_rsa', 'utf8')
 })
 if you want to use the raw string as private key
 */

 /*
.then( function() {
  // Local, Remote
  ssh.putFile('/home/steel/Lab/localPath/fileName', '/home/steel/Lab/remotePath/fileName').then(function() {
    console.log("The File thing is done")
  }, function(error) {
    console.log("Something's wrong")
    console.log(error)
  })
  // Array<Shape('local' => string, 'remote' => string)>
  ssh.putFiles([{ local: '/home/steel/Lab/localPath/fileName', remote: '/home/steel/Lab/remotePath/fileName' }]).then(function() {
    console.log("The File thing is done")
  }, function(error) {
    console.log("Something's wrong")
    console.log(error)
  })
  // Local, Remote
  ssh.getFile('/home/steel/Lab/localPath', '/home/steel/Lab/remotePath').then(function(Contents) {
    console.log("The File's contents were successfully downloaded")
  }, function(error) {
    console.log("Something's wrong")
    console.log(error)
  })
  // Putting entire directories
  const failed = []
  const successful = []
  ssh.putDirectory('/home/steel/Lab', '/home/steel/Lab', {
    recursive: true,
    concurrency: 10,
    // ^ WARNING: Not all servers support high concurrency
    // try a bunch of values and see what works on your server
    validate: function(itemPath) {
      const baseName = path.basename(itemPath)
      return baseName.substr(0, 1) !== '.' && // do not allow dot files
             baseName !== 'node_modules' // do not allow node_modules
    },
    tick: function(localPath, remotePath, error) {
      if (error) {
        failed.push(localPath)
      } else {
        successful.push(localPath)
      }
    }
  }).then(function(status) {
    console.log('the directory transfer was', status ? 'successful' : 'unsuccessful')
    console.log('failed transfers', failed.join(', '))
    console.log('successful transfers', successful.join(', '))
  })
  // Command
  ssh.execCommand('hh_client --json', { cwd:'/var/www' }).then(function(result) {
    console.log('STDOUT: ' + result.stdout)
    console.log('STDERR: ' + result.stderr)
  })
  // Command with escaped params
  ssh.exec('hh_client', ['--json'], { cwd: '/var/www', stream: 'stdout', options: { pty: true } }).then(function(result) {
    console.log('STDOUT: ' + result)
  })
  // With streaming stdout/stderr callbacks
  ssh.exec('hh_client', ['--json'], {
    cwd: '/var/www',
    onStdout(chunk) {
      console.log('stdoutChunk', chunk.toString('utf8'))
    },
    onStderr(chunk) {
      console.log('stderrChunk', chunk.toString('utf8'))
    },
  })
})
*/

}

async function replayOutput( strFileName ) {

  const fileStream = fs.createReadStream( strFileName );

  const readlineIns = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let lastNow = null;

  for await ( const strLine of readlineIns ) {
    
    await new Promise( ( resolve, reject ) => { 

      // Each line in input.txt will be successively available here as `line`.
      //console.log(`Line from file: ${line}`);
      const lineParts = strLine.split( " => " );

      if ( lineParts.length >= 4 ) {

        let intTime = parseInt( lineParts[ 0 ].replace( "[+", "" ).replace( "ms]", "" ) );

        //console.log(  "time:",  intTime );

        let now = dayjs();

        //process.exit( 0 );

        while ( intTime > 0 && lastNow && now.diff( lastNow ) < intTime ) {
 
          //console.log( "Sleeping..." )
          sleep( 1000 );

          now = dayjs();

        }

        /*
        if ( lineParts[ 4 ] === "[@__CR__@]" ) {

          process.stdout.write( lineParts[ 3 ] + "\r" );

        }
        else if ( lineParts[ 4 ] === "[@__LF__@]" ) {

          process.stdout.write( lineParts[ 3 ] + "\n" );

        }
        else if ( lineParts[ 4 ] === "[@__CR__@][@__LF__@]" ) {

          process.stdout.write( lineParts[ 3 ] + "\r\n" );

        }
        else {

          process.stdout.write( lineParts[ 3 ] );

        }
        */

        const strLine = lineParts[ 3 ].replace( "[@__LF__@]", "\n" ).replace( "[@__CR__@]", "\r" );

        process.stdout.write( strLine );

        lastNow = now;

        resolve( true );

        /*
        let intervalHandler = setInterval( () => {

          if ( intTime > 0 ) {
          
            const now = dayjs();

            if ( lastNow === null || now.diff( lastNow ) >= intTime ) {

              process.stdout.write( strLine );

            }

            lastNow = now;

          }
          else {

            clearInterval( intervalHandler );

          }

        }, 1000 );
        */

      }

    });

  }
}


main();
//replayOutput( "output-2021-06-17T14-11-48-578Z-07:00.txt" );
//replayOutput( "output-2021-06-17T12-15-54-746Z-07:00.txt" );