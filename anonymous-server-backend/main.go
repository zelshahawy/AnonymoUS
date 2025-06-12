package main

import (
	"flag"
	"fmt"

	"github.com/zelshahawy/Anonymous_backend/config"
	"github.com/zelshahawy/Anonymous_backend/router"
	"github.com/zelshahawy/Anonymous_backend/version"
)

func main() {

	versionFlag := flag.Bool("version", false, "Version")
	flag.Parse()

	config.ValidateRequired(
		"mongo_uri",
		"secret_key",
		"google_client_id",
		"google_client_secret",
		"recaptcha_secret",
	)
	config.LoadConfig()

	if *versionFlag {
		fmt.Println("Build Date:", version.BuildDate)
		fmt.Println("Git Commit:", version.GitCommit)
		fmt.Println("Version:", version.Version)
		fmt.Println("Go Version:", version.GoVersion)
		fmt.Println("OS / Arch:", version.OsArch)
		return
	}
	fmt.Println("Anonymous Backend Server Entry Point Called.")
	router.StartServer()

}
