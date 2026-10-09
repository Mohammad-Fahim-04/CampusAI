import ctypes
import logging
import os
import sys
from contextlib import asynccontextmanager
from ctypes import wintypes
from pathlib import Path

logger = logging.getLogger(__name__)
BYTES_PER_MIB = 1024 * 1024


def _process_memory_mb() -> tuple[float, float]:
    if sys.platform.startswith("linux"):
        status = Path("/proc/self/status").read_text(encoding="ascii")
        values = {}
        for line in status.splitlines():
            if line.startswith(("VmRSS:", "VmHWM:")):
                key, value, _unit = line.split()
                values[key[:-1]] = int(value) / 1024
        if "VmRSS" not in values or "VmHWM" not in values:
            raise OSError("Linux process memory metrics were not available.")
        return values["VmRSS"], values["VmHWM"]

    if os.name == "nt":
        class ProcessMemoryCounters(ctypes.Structure):
            _fields_ = [
                ("cb", wintypes.DWORD),
                ("PageFaultCount", wintypes.DWORD),
                ("PeakWorkingSetSize", ctypes.c_size_t),
                ("WorkingSetSize", ctypes.c_size_t),
                ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPagedPoolUsage", ctypes.c_size_t),
                ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                ("PagefileUsage", ctypes.c_size_t),
                ("PeakPagefileUsage", ctypes.c_size_t),
            ]

        kernel32 = ctypes.WinDLL("Kernel32.dll", use_last_error=True)
        psapi = ctypes.WinDLL("Psapi.dll", use_last_error=True)
        kernel32.GetCurrentProcess.restype = wintypes.HANDLE
        psapi.GetProcessMemoryInfo.argtypes = [
            wintypes.HANDLE,
            ctypes.POINTER(ProcessMemoryCounters),
            wintypes.DWORD,
        ]
        psapi.GetProcessMemoryInfo.restype = wintypes.BOOL

        counters = ProcessMemoryCounters()
        counters.cb = ctypes.sizeof(counters)
        if not psapi.GetProcessMemoryInfo(
            kernel32.GetCurrentProcess(),
            ctypes.byref(counters),
            counters.cb,
        ):
            raise ctypes.WinError(ctypes.get_last_error())
        return (
            counters.WorkingSetSize / BYTES_PER_MIB,
            counters.PeakWorkingSetSize / BYTES_PER_MIB,
        )

    raise OSError(f"Process RSS metrics are unsupported on {sys.platform}.")


def log_process_memory(stage: str) -> None:
    try:
        rss_mb, peak_mb = _process_memory_mb()
    except (OSError, ValueError) as exc:
        logger.warning("[MEMORY] %s metrics unavailable: %s", stage, exc)
        return
    logger.info(
        "[MEMORY] %s RSS=%.1f MiB peak_RSS=%.1f MiB",
        stage,
        rss_mb,
        peak_mb,
    )


@asynccontextmanager
async def memory_logging_lifespan(_app):
    log_process_memory("application startup")
    yield
