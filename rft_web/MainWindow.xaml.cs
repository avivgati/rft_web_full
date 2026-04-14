using System.Diagnostics;
using System.Text.Json;
using System.Windows;
using System.IO;
namespace Rft_Wpf_Web
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public class WebCommand
        {
            public string Type { get; set; }
            public string Command { get; set; }
            public int Value { get; set; }
        }


        public MainWindow()
        {
            InitializeComponent();
            InitializeWebViewAsync();
        }


        private async void InitializeWebViewAsync()
        {
            await mainWebView.EnsureCoreWebView2Async();
            mainWebView.CoreWebView2.WebMessageReceived += mainWebView_WebMessageReceived;
            // Now it is SAFE to load content
            LoadHtml();
        }


        private void mainWebView_WebMessageReceived(
            object sender,
            Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs e)
        {
            string json = e.WebMessageAsJson;
            string text = e.TryGetWebMessageAsString();

            if (text != null)
            {
                HandleTextMessage(text);
                return;
            }

            HandleJsonMessage(json);
        }
        private void HandleTextMessage(string text)
        {
            Debug.WriteLine(text);
        }

        private void HandleJsonMessage(string json)
        {
            var msg = JsonSerializer.Deserialize<WebCommand>(json);

            if (msg.Type == "uart")
            {
                //SendToUart(msg.Command, msg.Value);
            }
            else if (msg.Type == "udp")
            {
                //SendToUdp(msg.Command, msg.Value);
            }
        }



        private void LoadHtml()
        {

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;

            string htmlPath = Path.Combine(baseDir, "GUI", "index.html");

            mainWebView.Source = new Uri(htmlPath);

        }

        private void MinimizeClick(object sender, RoutedEventArgs e)
        {
            SystemCommands.MinimizeWindow(this);
        }

        private void MaximizeClick(object sender, RoutedEventArgs e)
        {
            if (this.WindowState == WindowState.Maximized)
                SystemCommands.RestoreWindow(this);
            else
                SystemCommands.MaximizeWindow(this);
        }

        private void CloseClick(object sender, RoutedEventArgs e)
        {
            SystemCommands.CloseWindow(this);
        }

    }
}