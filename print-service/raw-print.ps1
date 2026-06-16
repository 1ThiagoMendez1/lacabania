<#
.SYNOPSIS
    Envía datos RAW a una impresora usando la API Win32 de Windows.
    Uso interno del servicio de impresión La Cabaña.
#>
param(
    [Parameter(Mandatory=$true)][string]$printerName,
    [Parameter(Mandatory=$true)][string]$dataFile
)

$bytes = [System.IO.File]::ReadAllBytes($dataFile)

$source = @"
using System;
using System.Runtime.InteropServices;

public class RawPrint {
    [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFO di);

    [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFO di = new DOCINFO();
        di.pDocName = "Comanda La Cabana";
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero))
            throw new Exception("No se pudo abrir la impresora: " + szPrinterName + " (Win32 error " + Marshal.GetLastWin32Error() + ")");

        try {
            if (StartDocPrinter(hPrinter, 1, di) == 0)
                throw new Exception("StartDocPrinter falló (Win32 error " + Marshal.GetLastWin32Error() + ")");
            StartPagePrinter(hPrinter);

            IntPtr pUnmanaged = Marshal.AllocCoTaskMem(pBytes.Length);
            try {
                Marshal.Copy(pBytes, 0, pUnmanaged, pBytes.Length);
                int written;
                if (!WritePrinter(hPrinter, pUnmanaged, pBytes.Length, out written))
                    throw new Exception("WritePrinter falló (Win32 error " + Marshal.GetLastWin32Error() + ")");
            } finally {
                Marshal.FreeCoTaskMem(pUnmanaged);
            }

            EndPagePrinter(hPrinter);
            EndDocPrinter(hPrinter);
        } finally {
            ClosePrinter(hPrinter);
        }
        return true;
    }
}

[StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
public class DOCINFO {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
}
"@

Add-Type -TypeDefinition $source -Language CSharp -ErrorAction Stop

try {
    [RawPrint]::SendBytesToPrinter($printerName, $bytes) | Out-Null
    Write-Output "OK"
    exit 0
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
