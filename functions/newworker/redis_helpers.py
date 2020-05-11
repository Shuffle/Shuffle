import logging
from contextlib import asynccontextmanager

import aioredis

logger = logging.getLogger("WALKOFF")


@asynccontextmanager
async def connect_to_redis_pool(redis_uri) -> aioredis.Redis:
    # Redis client bound to pool of connections (auto-reconnecting).
    redis = await aioredis.create_redis_pool(redis_uri)
    try:
        yield redis
    finally:
        # gracefully close pool
        redis.close()
        await redis.wait_closed()
        logger.info("Redis connection pool closed.")


def deref_stream_message(message):
    try:
        key, value = message[0][-1].popitem()
        stream = message[0][0]
        id = message[0][1]
        return (key, value), stream, id

    except:
        logger.exception("Stream message formatted incorrectly.")


def xlen(redis: aioredis.Redis, key):
    """Returns the number of entries inside a stream."""
    return redis.execute(b'XLEN', key)


def xdel(redis: aioredis.Redis, stream, id):
    """ Deletes id from stream. Returns the number of items deleted. """
    return redis.execute(b'XDEL', stream, id)
