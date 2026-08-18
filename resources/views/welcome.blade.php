<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light">

        <title>{{ config('app.name', 'ISPCore') }} · Operations Console</title>

        @fonts

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="antialiased bg-slate-50 text-slate-900">
        <div id="app">
            <div class="flex min-h-screen items-center justify-center text-sm text-slate-400">
                Loading ISPCore…
            </div>
        </div>
    </body>
</html>
