import logging
import asyncio
import sys
import warnings
from logging import StreamHandler, DEBUG, INFO, ERROR, WARNING, CRITICAL, raiseExceptions


class AsyncHandler(StreamHandler):
    """ An async wrapper around logging.StreamHandler for async log streams like Redis PUB/SUB"""
    def __init__(self, stream=None, loop=None):
        """
        Initialize the handler.

        If stream is not specified, sys.stderr is used.
        """
        super().__init__(stream)
        self.loop = loop

    async def flush(self):
        """
        Flushes the stream.
        """
        await self.stream.flush()

    async def emit(self, record):
        """
        Emit a record.

        If a formatter is specified, it is used to format the record.
        The record is then written to the stream with a trailing newline.  If
        exception information is present, it is formatted using
        traceback.print_exception and appended to the stream.  If the stream
        has an 'encoding' attribute, it is used to determine how to do the
        output to the stream.
        """
        try:
            msg = self.format(record)
            await self.stream.write(msg + self.terminator)
            await self.flush()
        except Exception:
            self.handleError(record)

    async def handle(self, record):
        """
        Conditionally emit the specified logging record.

        Emission depends on filters which may have been added to the handler.
        Wrap the actual emission of the record with acquisition/release of
        the I/O thread lock. Returns whether the filter passed the record for
        emission.
        """
        rv = self.filter(record)
        if rv:
            self.acquire()
            try:
                await self.emit(record)
            finally:
                self.release()
        return rv

    async def close(self):
        if self.stream is not None:
            await self.flush()
            await self.stream.close()
        super().close()


class AsyncLogger(logging.Logger):
    """ An async wrapper around logging.Logger for async log streams like Redis PUB/SUB """
    def __init__(self, name, level=logging.ERROR, loop=asyncio.get_event_loop()):
        super().__init__(name, level=level)
        self.loop = loop

    async def debug(self, msg, *args, **kwargs):
        """
        Log 'msg % args' with severity 'DEBUG'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.debug("Houston, we have a %s", "thorny problem", exc_info=1)
        """
        if self.isEnabledFor(DEBUG):
            await self._log(DEBUG, msg, args, **kwargs)

    async def info(self, msg, *args, **kwargs):
        """
        Log 'msg % args' with severity 'INFO'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.info("Houston, we have a %s", "interesting problem", exc_info=1)
        """
        if self.isEnabledFor(INFO):
            await self._log(INFO, msg, args, **kwargs)

    async def warning(self, msg, *args, **kwargs):
        """
        Log 'msg % args' with severity 'WARNING'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.warning("Houston, we have a %s", "bit of a problem", exc_info=1)
        """
        if self.isEnabledFor(WARNING):
            await self._log(WARNING, msg, args, **kwargs)

    async def warn(self, msg, *args, **kwargs):
        warnings.warn("The 'warn' method is deprecated, use 'warning' instead", DeprecationWarning, 2)
        await self.warning(msg, *args, **kwargs)

    async def error(self, msg, *args, **kwargs):
        """
        Log 'msg % args' with severity 'ERROR'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.error("Houston, we have a %s", "major problem", exc_info=1)
        """
        if self.isEnabledFor(ERROR):
            await self._log(ERROR, msg, args, **kwargs)

    async def exception(self, msg, *args, exc_info=True, **kwargs):
        """
        Convenience method for logging an ERROR with exception information.
        """
        await self.error(msg, *args, exc_info=exc_info, **kwargs)

    async def critical(self, msg, *args, **kwargs):
        """
        Log 'msg % args' with severity 'CRITICAL'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.critical("Houston, we have a %s", "major disaster", exc_info=1)
        """
        if self.isEnabledFor(CRITICAL):
            await self._log(CRITICAL, msg, args, **kwargs)

    fatal = critical

    async def log(self, level, msg, *args, **kwargs):
        """
        Log 'msg % args' with the integer severity 'level'.

        To pass exception information, use the keyword argument exc_info with
        a true value, e.g.

        logger.log(level, "We have a %s", "mysterious problem", exc_info=1)
        """
        if not isinstance(level, int):
            if raiseExceptions:
                raise TypeError("level must be an integer")
            else:
                return
        if self.isEnabledFor(level):
            await self._log(level, msg, args, **kwargs)

    async def _log(self, level, msg, args, exc_info=None, extra=None, stack_info=False):
        """
        Low-level logging routine which creates a LogRecord and then calls
        all the handlers of this logger to handle the record.
        """
        sinfo = None
        if logging._srcfile:
            try:
                fn, lno, func, sinfo = self.findCaller(stack_info)
            except ValueError:
                fn, lno, func = "(unknown file)", 0, "(unknown function)"
        else:
            fn, lno, func = "(unknown file)", 0, "(unknown function)"
        if exc_info:
            if isinstance(exc_info, BaseException):
                exc_info = (type(exc_info), exc_info, exc_info.__traceback__)
            elif not isinstance(exc_info, tuple):
                exc_info = sys.exc_info()
        record = self.makeRecord(self.name, level, fn, lno, msg, args,
                                 exc_info, func, extra, sinfo)
        await self.handle(record)

    async def handle(self, record):
        """
        Call the handlers for the specified record.

        This method is used for unpickled records received from a socket, as
        well as those created locally. Logger-level filtering is applied.
        """
        if (not self.disabled) and self.filter(record):
            await self.callHandlers(record)

    async def callHandlers(self, record):
        """
        Pass a record to all relevant handlers.

        Loop through all handlers for this logger and its parents in the
        logger hierarchy. If no handler was found, output a one-off error
        message to sys.stderr. Stop searching up the hierarchy whenever a
        logger with the "propagate" attribute set to zero is found - that
        will be the last logger whose handlers are called.
        """
        c = self
        found = 0
        while c:
            for hdlr in c.handlers:
                found += 1
                if record.levelno >= hdlr.level:
                    await hdlr.handle(record)
            if not c.propagate:
                c = None
            else:
                c = c.parent
        if found == 0:
            if logging.lastResort:
                if record.levelno >= logging.lastResort.level:
                    logging.lastResort.handle(record)
            elif logging.raiseExceptions and not self.manager.emittedNoHandlerWarning:
                sys.stderr.write("No handlers could be found for logger"
                                 " \"%s\"\n" % self.name)
                self.manager.emittedNoHandlerWarning = True

    async def shutdown(self):
        """
        Perform any cleanup actions in the logging system (e.g. flushing
        buffers).

        Should be called at application exit.
        """
        for handler in reversed(self.handlers):
            # errors might occur, for example, if files are locked
            # we just ignore them if raiseExceptions is not set
            try:
                if handler:
                    try:
                        # await handler.acquire()  # do we need to lock?
                        await handler.flush()
                        await handler.close()
                    except (OSError, ValueError):
                        # Ignore errors which might be caused
                        # because handlers have been closed but
                        # references to them are still around at
                        # application exit.
                        pass
                    except Exception:
                        pass
                    finally:
                        # handler.release()  # We need to release if we decide to lock I guess
                        self.removeHandler(handler)
            except Exception:  # ignore everything, as we're shutting down
                pass
