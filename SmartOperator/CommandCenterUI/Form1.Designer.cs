namespace CommandCenterUI
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtUnitName = new System.Windows.Forms.TextBox();
            this.txtEventType = new System.Windows.Forms.TextBox();
            this.txtIntensityLevel = new System.Windows.Forms.TextBox();
            this.buttonReportAnIncident = new System.Windows.Forms.Button();
            this.labelUnitName = new System.Windows.Forms.Label();
            this.labelEventType = new System.Windows.Forms.Label();
            this.labelIntensityLvel = new System.Windows.Forms.Label();
            this.dataGridView1 = new System.Windows.Forms.DataGridView();
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView1)).BeginInit();
            this.SuspendLayout();
            // 
            // txtUnitName
            // 
            this.txtUnitName.Location = new System.Drawing.Point(546, 146);
            this.txtUnitName.Name = "txtUnitName";
            this.txtUnitName.Size = new System.Drawing.Size(100, 26);
            this.txtUnitName.TabIndex = 0;
            // 
            // txtEventType
            // 
            this.txtEventType.Location = new System.Drawing.Point(545, 216);
            this.txtEventType.Name = "txtEventType";
            this.txtEventType.Size = new System.Drawing.Size(100, 26);
            this.txtEventType.TabIndex = 1;
            // 
            // txtIntensityLevel
            // 
            this.txtIntensityLevel.Location = new System.Drawing.Point(546, 291);
            this.txtIntensityLevel.Name = "txtIntensityLevel";
            this.txtIntensityLevel.Size = new System.Drawing.Size(100, 26);
            this.txtIntensityLevel.TabIndex = 2;
            this.txtIntensityLevel.TextChanged += new System.EventHandler(this.txtIntensityLevel_TextChanged);
            // 
            // buttonReportAnIncident
            // 
            this.buttonReportAnIncident.Location = new System.Drawing.Point(533, 342);
            this.buttonReportAnIncident.Name = "buttonReportAnIncident";
            this.buttonReportAnIncident.Size = new System.Drawing.Size(197, 48);
            this.buttonReportAnIncident.TabIndex = 3;
            this.buttonReportAnIncident.Text = "Report an incident";
            this.buttonReportAnIncident.UseVisualStyleBackColor = true;
            this.buttonReportAnIncident.Click += new System.EventHandler(this.buttonReportAnIncident_Click);
            // 
            // labelUnitName
            // 
            this.labelUnitName.AutoSize = true;
            this.labelUnitName.Location = new System.Drawing.Point(546, 103);
            this.labelUnitName.Name = "labelUnitName";
            this.labelUnitName.Size = new System.Drawing.Size(82, 20);
            this.labelUnitName.TabIndex = 4;
            this.labelUnitName.Text = "Unit name";
            // 
            // labelEventType
            // 
            this.labelEventType.AutoSize = true;
            this.labelEventType.Location = new System.Drawing.Point(550, 179);
            this.labelEventType.Name = "labelEventType";
            this.labelEventType.Size = new System.Drawing.Size(84, 20);
            this.labelEventType.TabIndex = 5;
            this.labelEventType.Text = "Event type";
            // 
            // labelIntensityLvel
            // 
            this.labelIntensityLvel.AutoSize = true;
            this.labelIntensityLvel.Location = new System.Drawing.Point(546, 258);
            this.labelIntensityLvel.Name = "labelIntensityLvel";
            this.labelIntensityLvel.Size = new System.Drawing.Size(104, 20);
            this.labelIntensityLvel.TabIndex = 6;
            this.labelIntensityLvel.Text = "Intensity level";
            // 
            // dataGridView1
            // 
            this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dataGridView1.Location = new System.Drawing.Point(66, 128);
            this.dataGridView1.Name = "dataGridView1";
            this.dataGridView1.RowHeadersWidth = 62;
            this.dataGridView1.RowTemplate.Height = 28;
            this.dataGridView1.Size = new System.Drawing.Size(240, 150);
            this.dataGridView1.TabIndex = 7;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(9F, 20F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.dataGridView1);
            this.Controls.Add(this.labelIntensityLvel);
            this.Controls.Add(this.labelEventType);
            this.Controls.Add(this.labelUnitName);
            this.Controls.Add(this.buttonReportAnIncident);
            this.Controls.Add(this.txtIntensityLevel);
            this.Controls.Add(this.txtEventType);
            this.Controls.Add(this.txtUnitName);
            this.Name = "Form1";
            this.Text = "Form1";
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView1)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox txtUnitName;
        private System.Windows.Forms.TextBox txtEventType;
        private System.Windows.Forms.TextBox txtIntensityLevel;
        private System.Windows.Forms.Button buttonReportAnIncident;
        private System.Windows.Forms.Label labelUnitName;
        private System.Windows.Forms.Label labelEventType;
        private System.Windows.Forms.Label labelIntensityLvel;
        private System.Windows.Forms.DataGridView dataGridView1;
    }
}

