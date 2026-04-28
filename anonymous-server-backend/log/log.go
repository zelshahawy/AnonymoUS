package log

import (
	"os"

	"github.com/sirupsen/logrus"
	"github.com/zelshahawy/Anonymous_backend/config"
)

// Logger defines a set of methods for writing application logs. Derived from and
// inspired by logrus.Entry.
type Logger interface {
	Debug(args ...any)
	Debugf(format string, args ...any)
	Debugln(args ...any)
	Error(args ...any)
	Errorf(format string, args ...any)
	Errorln(args ...any)
	Fatal(args ...any)
	Fatalf(format string, args ...any)
	Fatalln(args ...any)
	Info(args ...any)
	Infof(format string, args ...any)
	Infoln(args ...any)
	Panic(args ...any)
	Panicf(format string, args ...any)
	Panicln(args ...any)
	Print(args ...any)
	Printf(format string, args ...any)
	Println(args ...any)
	Warn(args ...any)
	Warnf(format string, args ...any)
	Warning(args ...any)
	Warningf(format string, args ...any)
	Warningln(args ...any)
	Warnln(args ...any)
}

var defaultLogger *logrus.Logger

func init() {
	defaultLogger = newLogrusLogger(config.Config())
}

// NewLogger returns a configured logrus instance
func NewLogger(cfg config.Provider) *logrus.Logger {
	return newLogrusLogger(cfg)
}

func newLogrusLogger(cfg config.Provider) *logrus.Logger {

	l := logrus.New()

	if cfg.GetBool("json_logs") {
		l.Formatter = new(logrus.JSONFormatter)
	}
	l.Out = os.Stderr

	switch cfg.GetString("loglevel") {
	case "debug":
		l.Level = logrus.DebugLevel
	case "warning":
		l.Level = logrus.WarnLevel
	case "info":
		l.Level = logrus.InfoLevel
	default:
		l.Level = logrus.DebugLevel
	}

	return l
}

// Fields is a map string interface to define fields in the structured log
type Fields map[string]any

// With allow us to define fields in out structured logs
func (f Fields) With(k string, v any) Fields {
	f[k] = v
	return f
}

// WithFields allow us to define fields in out structured logs
func (f Fields) WithFields(f2 Fields) Fields {
	for k, v := range f2 {
		f[k] = v
	}
	return f
}

// WithFields allow us to define fields in out structured logs
func WithFields(fields Fields) Logger {
	return defaultLogger.WithFields(logrus.Fields(fields))
}

// Debug package-level convenience method.
func Debug(args ...any) {
	defaultLogger.Debug(args...)
}

// Debugf package-level convenience method.
func Debugf(format string, args ...any) {
	defaultLogger.Debugf(format, args...)
}

// Debugln package-level convenience method.
func Debugln(args ...any) {
	defaultLogger.Debugln(args...)
}

// Error package-level convenience method.
func Error(args ...any) {
	defaultLogger.Error(args...)
}

// Errorf package-level convenience method.
func Errorf(format string, args ...any) {
	defaultLogger.Errorf(format, args...)
}

// Errorln package-level convenience method.
func Errorln(args ...any) {
	defaultLogger.Errorln(args...)
}

// Fatal package-level convenience method.
func Fatal(args ...any) {
	defaultLogger.Fatal(args...)
}

// Fatalf package-level convenience method.
func Fatalf(format string, args ...any) {
	defaultLogger.Fatalf(format, args...)
}

// Fatalln package-level convenience method.
func Fatalln(args ...any) {
	defaultLogger.Fatalln(args...)
}

// Info package-level convenience method.
func Info(args ...any) {
	defaultLogger.Info(args...)
}

// Infof package-level convenience method.
func Infof(format string, args ...any) {
	defaultLogger.Infof(format, args...)
}

// Infoln package-level convenience method.
func Infoln(args ...any) {
	defaultLogger.Infoln(args...)
}

// Panic package-level convenience method.
func Panic(args ...any) {
	defaultLogger.Panic(args...)
}

// Panicf package-level convenience method.
func Panicf(format string, args ...any) {
	defaultLogger.Panicf(format, args...)
}

// Panicln package-level convenience method.
func Panicln(args ...any) {
	defaultLogger.Panicln(args...)
}

// Print package-level convenience method.
func Print(args ...any) {
	defaultLogger.Print(args...)
}

// Printf package-level convenience method.
func Printf(format string, args ...any) {
	defaultLogger.Printf(format, args...)
}

// Println package-level convenience method.
func Println(args ...any) {
	defaultLogger.Println(args...)
}

// Warn package-level convenience method.
func Warn(args ...any) {
	defaultLogger.Warn(args...)
}

// Warnf package-level convenience method.
func Warnf(format string, args ...any) {
	defaultLogger.Warnf(format, args...)
}

// Warning package-level convenience method.
func Warning(args ...any) {
	defaultLogger.Warning(args...)
}

// Warningf package-level convenience method.
func Warningf(format string, args ...any) {
	defaultLogger.Warningf(format, args...)
}

// Warningln package-level convenience method.
func Warningln(args ...any) {
	defaultLogger.Warningln(args...)
}

// Warnln package-level convenience method.
func Warnln(args ...any) {
	defaultLogger.Warnln(args...)
}
