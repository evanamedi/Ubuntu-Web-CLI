// here we have an output of characters that are coming from an Ubuntu cli
// from within a docker container

// we need to parse these characters using regex so that the only thing displayed
// is the true response, and characters being displayed
// in other words- we need to exclude the cli setup characters, and only keep
// the strings that would normally appear

output = ` G[?2004h]0;myuser@ecb06f72dab0: /myuser@ecb06f72dab0:/$ ls [?2004l
            D[0m[01;36mbin[0m [01;34mdev[0m [01;34mhome[0m [01;34mmedia[0m [01;34mopt[0m [01;34mroot[0m [01;36msbin[0m [01;34msys[0m [01;34musr[0m [01;34mboot[0m [01;34metc[0m [01;36mlib[0m [01;34mmnt[0m [01;34mproc[0m [01;34mrun[0m [01;34msrv[0m [30;42mtmp[0m [01;34mvar[0m
            :[?2004h]0;myuser@ecb06f72dab0: /myuser@ecb06f72dab0:/$`;

// TRUE OUTPUT: bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var

// let regex = /(\x1b\[01;3[46]m)(\w+)(\x1b\[0m)/g;

// let matches = output.match(regex);

// matches = matches.map((match) =>
// 	match.replace(/(\x1b\[01;3[46]m)|(\x1b\[0m)/g, "")
// );

// matches = matches.sort();

// console.log(matches);

let cleanOutput = output.replace(
	/\x1b\[[0-9;]*[a-zA-Z]|[A-Z]|myuser@.*:\/\$|[%:]/g,
	""
);

cleanOutput = cleanOutput.trim().split(/\s+/).join(" ");

console.log(cleanOutput);
